import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Int "mo:base/Int";
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
import PetitionRepository "../petition/repository";
import Debug "mo:base/Debug";

module {
    public class Repository(
        petitionRepository: PetitionRepository.Repository
    ) {
        let comments = Table.Table<Types.Comment>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("comments")));

        public func create(
            req: Types.CommentRequest,
            callerId: Nat32
        ): Result.Result<Types.Comment, Text> {
            let comment = _createEntity(req, callerId);
            switch(comments.insert(comment._id, comment)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    _updatePetition(comment, true);
                    return #ok(comment);
                };
            };
        };

        public func update(
            comment: Types.Comment, 
            req: Types.CommentRequest,
            callerId: Nat32
        ): Result.Result<Types.Comment, Text> {
            let e = _updateEntity(comment, req, callerId);
            switch(comments.replace(comment._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            comment: Types.Comment,
            callerId: Nat32
        ): Result.Result<(), Text> {
            let e = _deleteEntity(comment, callerId);
            switch(comments.replace(comment._id, e)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case _ {
                    _updatePetition(comment, false);
                    #ok();
                }
            }
        };

        func _updatePetition(
            comment: Types.Comment,
            inc: Bool
        ) {
            switch(petitionRepository.findById(comment.petitionId))
            {
                case (#ok(petition)) {
                    if(inc) {
                        petitionRepository.onCommentInserted(petition, comment);
                    }
                    else {
                        petitionRepository.onCommentDeleted(petition, comment);
                    };
                };
                case _ {
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Comment, Text> {
            switch(comments.get(_id)) {
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
        ): Result.Result<Types.Comment, Text> {
            switch(comments.findOne([{
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
                                value = crit.2;
                            }
                        }
                    )
                };
            };
        };

        func _getComparer(
            column: Text,
            dir: Int
        ): (Types.Comment, Types.Comment) -> Int {
            switch(column) {
                case "_id" func(a: Types.Comment, b: Types.Comment): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Comment, b: Types.Comment): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Comment, b: Types.Comment): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "petitionId" func(a: Types.Comment, b: Types.Comment): Int = 
                    Utils.order2Int(Nat32.compare(a.petitionId, b.petitionId)) * dir;
                case _ {
                    func(a: Types.Comment, b: Types.Comment): Int = 0;
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
        ): ?[Table.SortBy<Types.Comment>] {
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
        ): Result.Result<[Types.Comment], Text> {
            return comments.find(_getCriterias(criterias), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByPetition(
            petitionId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Comment], Text> {

            func buildCriterias(petitionId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "petitionId";
                        op = #eq;
                        value = #nat32(petitionId);
                    }
                ]
            };
            
            return comments.find(buildCriterias(petitionId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func countByPetition(
            petitionId: Nat32
        ): Result.Result<Nat, Text> {

            func buildCriterias(petitionId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "petitionId";
                        op = #eq;
                        value = #nat32(petitionId);
                    }
                ]
            };
            
            return comments.count(buildCriterias(petitionId));
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Comment], Text> {

            func buildCriterias(userId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "createdBy";
                        op = #eq;
                        value = #nat32(userId);
                    }
                ]
            };
            
            return comments.find(buildCriterias(userId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return comments.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            comments.restore(entities);
        };

        func _createEntity(
            req: Types.CommentRequest,
            callerId: Nat32
        ): Types.Comment {
            {
                _id = comments.nextId();
                pubId = ulid.next();
                body = req.body;
                petitionId = req.petitionId;
                likes = 0;
                dislikes = 0;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            comment: Types.Comment, 
            req: Types.CommentRequest,
            callerId: Nat32
        ): Types.Comment {
            {
                _id = comment._id;
                pubId = comment.pubId;
                body = req.body;
                petitionId = req.petitionId;
                likes = comment.likes;
                dislikes = comment.dislikes;
                createdAt = comment.createdAt;
                createdBy = comment.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _deleteEntity(
            comment: Types.Comment, 
            callerId: Nat32
        ): Types.Comment {
            {
                _id = comment._id;
                pubId = comment.pubId;
                body = "";
                petitionId = comment.petitionId;
                likes = comment.likes;
                dislikes = comment.dislikes;
                createdAt = comment.createdAt;
                createdBy = comment.createdBy;
                updatedAt = comment.updatedAt;
                updatedBy = comment.updatedBy;
                deletedAt = ?Time.now();
                deletedBy = ?callerId;
            }  
        };
    };

    func serialize(
        entity: Types.Comment,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(entity._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(entity.pubId) else entity.pubId));
        res.put("body", #text(if ignoreCase Utils.toLower(entity.body) else entity.body));
        res.put("petitionId", #nat32(entity.petitionId));
        res.put("likes", #nat32(entity.likes));
        res.put("dislikes", #nat32(entity.dislikes));
        res.put("createdAt", #int(entity.createdAt));
        res.put("createdBy", #nat32(entity.createdBy));
        res.put("updatedAt", switch(entity.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(entity.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Comment {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            body = Variant.getOptText(map.get("body"));
            petitionId = Variant.getOptNat32(map.get("petitionId"));
            likes = Variant.getOptNat32(map.get("likes"));
            dislikes = Variant.getOptNat32(map.get("dislikes"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};