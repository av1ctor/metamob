import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Variant "mo:mo-table/variant";
import Table "mo:mo-table/table";
import Random "../common/random";
import ULID "../common/ulid";
import Utils "../common/utils";
import Types "./types";
import Schema "./schema";
import CommentTypes "../comment/types";
import Debug "mo:base/Debug";

module {
    public class Repository() {
        let petitions = Table.Table<Types.Petition>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("petitions")));

        public func create(
            req: Types.PetitionRequest,
            callerId: Nat32
        ): Result.Result<Types.Petition, Text> {
            let e = _createEntity(req, callerId);
            switch(petitions.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            petition: Types.Petition, 
            req: Types.PetitionRequest,
            callerId: Nat32
        ): Result.Result<Types.Petition, Text> {
            let e = _updateEntity(petition, req, callerId);
            switch(petitions.replace(petition._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            petition: Types.Petition,
            callerId: Nat32
        ): Result.Result<(), Text> {
            let e = _deleteEntity(petition, callerId);
            switch(petitions.replace(petition._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    //FIXME: delete petition's comments
                    return #ok();
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Petition, Text> {
            switch(petitions.get(_id)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(entity)) {
                    switch(entity) {
                        case null {
                            return #err("Not found");
                        };
                        case (?entity) {
                            return #ok(entity);
                        };
                    };
                };
            };
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Petition, Text> {
            switch(petitions.findOne([{
                key = "pubId";
                op = #eq;
                value = #text(Utils.toLower(pubId));
            }])) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(entity)) {
                    switch(entity) {
                        case null {
                            return #err("Not found");
                        };
                        case (?entity) {
                            return #ok(entity);
                        };
                    };
                };
            };
        };

        func _getCriterias(
            criterias: ?[(Text, Text, Variant.Variant)]
        ): ?[Table.Criteria] {

            switch(criterias) {
                case null {
                    null;
                };
                case (?criterias) {
                    ?Array.map(
                        criterias, 
                        func (crit: (Text, Text, Variant.Variant)): Table.Criteria {
                            {
                                key = crit.0;
                                op = switch(crit.1) {
                                    case "contains" #contains; 
                                    case _ #eq;
                                };
                                value = switch(crit.2) {
                                    case (#text(text)) {
                                        #text(Utils.toLower(text));
                                    };
                                    case _ {
                                        crit.2;
                                    };
                                };
                            }
                        }
                    )
                };
            };
        };

        func _getComparer(
            column: Text,
            dir: Int
        ): (Types.Petition, Types.Petition) -> Int {
            switch(column) {
                case "_id" func(a: Types.Petition, b: Types.Petition): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Petition, b: Types.Petition): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "title" func(a: Types.Petition, b: Types.Petition): Int = 
                    Utils.order2Int(Text.compare(a.title, b.title)) * dir;
                case "state" func(a: Types.Petition, b: Types.Petition): Int = 
                    Utils.order2Int(Nat8.compare(a.state, b.state)) * dir;
                case "result" func(a: Types.Petition, b: Types.Petition): Int = 
                    Utils.order2Int(Nat8.compare(a.result, b.result)) * dir;
                case "publishedAt" func(a: Types.Petition, b: Types.Petition): Int = 
                    Utils.order2Int(Utils.compareIntOpt(a.publishedAt, b.publishedAt)) * dir;
                case "createdAt" func(a: Types.Petition, b: Types.Petition): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "updatedAt" func(a: Types.Petition, b: Types.Petition): Int = 
                    Utils.order2Int(Utils.compareIntOpt(a.updatedAt, b.updatedAt)) * dir;
                case "categoryId" func(a: Types.Petition, b: Types.Petition): Int = 
                    Utils.order2Int(Nat32.compare(a.categoryId, b.categoryId)) * dir;
                case _ {
                    func(a: Types.Petition, b: Types.Petition): Int = 0;
                };
            };
        };

        func _getDir(
            sortBy: ?(Text, Text)
        ): Int {
            switch(sortBy) {
                case null {
                    1;
                };
                case (?sortBy) {
                    switch(sortBy.1) {
                        case "desc" -1;
                        case _ 1;
                    };
                };
            };
        };

        func _getSortBy(
            sortBy: ?(Text, Text)
        ): ?[Table.SortBy<Types.Petition>] {
            let dir = _getDir(sortBy);
            
            switch(sortBy) {
                case null {
                    null;
                };
                case (?sortBy) {
                    ?[{
                        key = sortBy.0;
                        dir = if(dir == 1) #asc else #desc;
                        cmp = _getComparer(sortBy.0, dir);
                    }]
                };
            };
        };

        func _getLimit(
            limit: ?(Nat, Nat)
        ): ?Table.Limit {
            switch(limit) {
                case null null;
                case (?limit) 
                    ?{
                        offset = limit.0;
                        size = limit.1;
                    }
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Petition], Text> {
            return petitions.find(_getCriterias(criterias), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByCategory(
            categoryId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Petition], Text> {

            func buildCriterias(categoryId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "categoryId";
                        op = #eq;
                        value = #nat32(categoryId);
                    }
                ]
            };
            
            return petitions.find(buildCriterias(categoryId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByTag(
            tagId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Petition], Text> {

            func buildCriterias(tagId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "tagId";
                        op = #eq;
                        value = #nat32(tagId);
                    }
                ]
            };
            
            return petitions.find(buildCriterias(tagId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Petition], Text> {

            func buildCriterias(userId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "createdBy";
                        op = #eq;
                        value = #nat32(userId);
                    }
                ]
            };
            
            return petitions.find(buildCriterias(userId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func onCommentInserted(
            petition: Types.Petition,
            comment: CommentTypes.Comment
        ) {
            ignore petitions.replace(petition._id, _updateEntityWhenCommentInserted(petition, comment));
        };

        public func onCommentDeleted(
            petition: Types.Petition,
            comment: CommentTypes.Comment
        ) {
            ignore petitions.replace(petition._id, _updateEntityWhenCommentDeleted(petition, comment));
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return petitions.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            petitions.restore(entities);
        };

        func _createEntity(
            req: Types.PetitionRequest,
            callerId: Nat32
        ): Types.Petition {
            let now: Int = Time.now();
            {
                _id = petitions.nextId();
                pubId = ulid.next();
                title = req.title;
                cover = req.cover;
                body = req.body;
                categoryId = req.categoryId;
                state = Types.STATE_PUBLISHED;
                result = Types.RESULT_NONE;
                duration = req.duration;
                tags = req.tags;
                likes = 0;
                dislikes = 0;
                commentsCnt = 0;
                firstCommentAt = null;
                lastCommentAt = null;
                lastCommentBy = null;
                commenters = [];
                publishedAt = ?now;
                expiredAt = ?(now + Int64.toInt(Int64.fromNat64(Nat64.fromNat(Nat32.toNat(req.duration) * (24 * 60 * 60 * 1000000)))));
                createdAt = now;
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
                deletedAt = null;
                deletedBy = null;
            }
        };

        func _updateEntity(
            petition: Types.Petition, 
            req: Types.PetitionRequest,
            callerId: Nat32
        ): Types.Petition {
            {
                _id = petition._id;
                pubId = petition.pubId;
                title = req.title;
                cover = req.cover;
                body = req.body;
                categoryId = req.categoryId;
                state = petition.state;
                result = petition.result;
                duration = petition.duration;
                tags = req.tags;
                likes = petition.likes;
                dislikes = petition.dislikes;
                commentsCnt = petition.commentsCnt;
                firstCommentAt = petition.firstCommentAt;
                lastCommentAt = petition.lastCommentAt;
                lastCommentBy = petition.lastCommentBy;
                commenters = petition.commenters;
                publishedAt = petition.publishedAt;
                expiredAt = petition.expiredAt;
                createdAt = petition.createdAt;
                createdBy = petition.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                deletedAt = petition.deletedAt;
                deletedBy = petition.deletedBy;
            }  
        };

        func _deleteEntity(
            petition: Types.Petition, 
            callerId: Nat32
        ): Types.Petition {
            {
                _id = petition._id;
                pubId = petition.pubId;
                title = "";
                cover = "";
                body = "";
                categoryId = petition.categoryId;
                state = Types.STATE_DELETED;
                result = petition.result;
                duration = petition.duration;
                tags = petition.tags;
                likes = petition.likes;
                dislikes = petition.dislikes;
                commentsCnt = petition.commentsCnt;
                firstCommentAt = petition.firstCommentAt;
                lastCommentAt = petition.lastCommentAt;
                lastCommentBy = petition.lastCommentBy;
                commenters = petition.commenters;
                publishedAt = petition.publishedAt;
                expiredAt = petition.expiredAt;
                createdAt = petition.createdAt;
                createdBy = petition.createdBy;
                updatedAt = petition.updatedAt;
                updatedBy = petition.updatedBy;
                deletedAt = ?Time.now();
                deletedBy = ?callerId;
            }  
        };

        func _updateEntityWhenCommentInserted(
            petition: Types.Petition, 
            comment: CommentTypes.Comment
        ): Types.Petition {
            {
                _id = petition._id;
                pubId = petition.pubId;
                title = petition.title;
                cover = petition.cover;
                body = petition.body;
                categoryId = petition.categoryId;
                state = petition.state;
                result = petition.result;
                duration = petition.duration;
                tags = petition.tags;
                likes = petition.likes;
                dislikes = petition.dislikes;
                commentsCnt = petition.commentsCnt + 1;
                firstCommentAt = switch(petition.firstCommentAt) {case null {?comment.createdAt}; case (?at) {?at};};
                lastCommentAt = ?comment.createdAt;
                lastCommentBy = ?comment.createdBy;
                commenters = Utils.addToArray(petition.commenters, comment.createdBy);
                publishedAt = petition.publishedAt;
                expiredAt = petition.expiredAt;
                createdAt = petition.createdAt;
                createdBy = petition.createdBy;
                updatedAt = petition.updatedAt;
                updatedBy = petition.updatedBy;
                deletedAt = petition.deletedAt;
                deletedBy = petition.deletedBy;
            }  
        };        

        func _updateEntityWhenCommentDeleted(
            petition: Types.Petition, 
            comment: CommentTypes.Comment
        ): Types.Petition {
            {
                _id = petition._id;
                pubId = petition.pubId;
                title = petition.title;
                cover = petition.cover;
                body = petition.body;
                categoryId = petition.categoryId;
                state = petition.state;
                result = petition.result;
                duration = petition.duration;
                tags = petition.tags;
                likes = petition.likes;
                dislikes = petition.dislikes;
                commentsCnt = petition.commentsCnt - (if(petition.commentsCnt > 0) 1 else 0);
                firstCommentAt = petition.firstCommentAt;
                lastCommentAt = petition.lastCommentAt;
                lastCommentBy = petition.lastCommentBy;
                commenters = Utils.delFromArray(petition.commenters, comment.createdBy, Nat32.equal);
                publishedAt = petition.publishedAt;
                expiredAt = petition.expiredAt;
                createdAt = petition.createdAt;
                createdBy = petition.createdBy;
                updatedAt = petition.updatedAt;
                updatedBy = petition.updatedBy;
                deletedAt = petition.deletedAt;
                deletedBy = petition.deletedBy;
            }  
        };        
    };

    func serialize(
        entity: Types.Petition,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);

        res.put("_id", #nat32(entity._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(entity.pubId) else entity.pubId));
        res.put("title", #text(if ignoreCase Utils.toLower(entity.title) else entity.title));
        res.put("cover", #text(entity.cover));
        res.put("body", #text(if ignoreCase Utils.toLower(entity.body) else entity.body));
        res.put("categoryId", #nat32(entity.categoryId));
        res.put("state", #nat8(entity.state));
        res.put("result", #nat8(entity.result));
        res.put("duration", #nat32(entity.duration));
        res.put("tags", #array(Array.map(entity.tags, func(id: Nat32): Variant.Variant {#nat32(id);})));
        res.put("likes", #nat32(entity.likes));
        res.put("dislikes", #nat32(entity.dislikes));
        res.put("commentsCnt", #nat32(entity.commentsCnt));
        res.put("firstCommentAt", switch(entity.firstCommentAt) {case null #nil; case (?firstCommentAt) #int(firstCommentAt);});
        res.put("lastCommentAt", switch(entity.lastCommentAt) {case null #nil; case (?lastCommentAt) #int(lastCommentAt);});
        res.put("lastCommentBy", switch(entity.lastCommentBy) {case null #nil; case (?lastCommentBy) #nat32(lastCommentBy);});
        res.put("commenters", #array(Array.map(entity.commenters, func(commenterId: Nat32): Variant.Variant {#nat32(commenterId);})));
        res.put("publishedAt", switch(entity.publishedAt) {case null #nil; case (?publishedAt) #int(publishedAt);});
        res.put("expiredAt", switch(entity.expiredAt) {case null #nil; case (?expiredAt) #int(expiredAt);});
        res.put("createdAt", #int(entity.createdAt));
        res.put("createdBy", #nat32(entity.createdBy));
        res.put("updatedAt", switch(entity.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(entity.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});
        res.put("deletedAt", switch(entity.deletedAt) {case null #nil; case (?deletedAt) #int(deletedAt);});
        res.put("deletedBy", switch(entity.deletedBy) {case null #nil; case (?deletedBy) #nat32(deletedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Petition {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            title = Variant.getOptText(map.get("title"));
            cover = Variant.getOptText(map.get("cover"));
            body = Variant.getOptText(map.get("body"));
            categoryId = Variant.getOptNat32(map.get("categoryId"));
            state = Variant.getOptNat8(map.get("state"));
            result = Variant.getOptNat8(map.get("result"));
            duration = Variant.getOptNat32(map.get("duration"));
            tags = Array.map(Variant.getOptArray(map.get("tags")), Variant.getNat32);
            likes = Variant.getOptNat32(map.get("likes"));
            dislikes = Variant.getOptNat32(map.get("dislikes"));
            commentsCnt = Variant.getOptNat32(map.get("commentsCnt"));
            firstCommentAt = Variant.getOptIntOpt(map.get("firstCommentAt"));
            lastCommentAt = Variant.getOptIntOpt(map.get("lastCommentAt"));
            lastCommentBy = Variant.getOptNat32Opt(map.get("lastCommentBy"));
            commenters = Array.map(Variant.getOptArray(map.get("commenters")), Variant.getNat32);
            publishedAt = Variant.getOptIntOpt(map.get("publishedAt"));
            expiredAt = Variant.getOptIntOpt(map.get("expiredAt"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
            deletedAt = Variant.getOptIntOpt(map.get("deletedAt"));
            deletedBy = Variant.getOptNat32Opt(map.get("deletedBy"));
        }
    };
};