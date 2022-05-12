import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
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
import SignatureTypes "../signatures/types";
import UpdateTypes "../updates/types";
import Debug "mo:base/Debug";

module {
    public class Repository() {
        let campaigns = Table.Table<Types.Campaign>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("campaigns")));

        public func create(
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _createEntity(req, callerId);
            switch(campaigns.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            campaign: Types.Campaign, 
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _updateEntity(campaign, req, callerId);
            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func finish(
            campaign: Types.Campaign, 
            result: Types.CampaignResult,
            callerId: Nat32
        ): Result.Result<Types.Campaign, Text> {
            let e = _updateEntityWhenFinished(campaign, result, callerId);
            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            campaign: Types.Campaign,
            callerId: Nat32
        ): Result.Result<(), Text> {
            let e = _deleteEntity(campaign, callerId);
            switch(campaigns.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    //FIXME: delete campaign's signatures
                    return #ok();
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Campaign, Text> {
            switch(campaigns.get(_id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(e)) {
                    switch(e) {
                        case null {
                            #err("Not found");
                        };
                        case (?e) {
                            if(Option.isSome(e.deletedAt)) {
                                return #err("Not found");
                            };
                            #ok(e);
                        };
                    };
                };
            };
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Campaign, Text> {
            switch(campaigns.findOne([{
                key = "pubId";
                op = #eq;
                value = #text(Utils.toLower(pubId));
            }])) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(e)) {
                    switch(e) {
                        case null {
                            #err("Not found");
                        };
                        case (?e) {
                            if(Option.isSome(e.deletedAt)) {
                                return #err("Not found");
                            };                            
                            #ok(e);
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
                    let buf = Buffer.Buffer<Table.Criteria>(criterias.size() + 1);
                    buf.add({       
                        key = "deletedAt";
                        op = #eq;
                        value = #nil;
                    });

                    for(crit in criterias.vals()) {
                        buf.add({
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
                        });
                    };

                    ?buf.toArray();
                };
            };
        };

        func _getComparer(
            column: Text,
            dir: Int
        ): (Types.Campaign, Types.Campaign) -> Int {
            switch(column) {
                case "_id" func(a: Types.Campaign, b: Types.Campaign): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "title" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Text.compare(a.title, b.title)) * dir;
                case "state" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Nat8.compare(a.state, b.state)) * dir;
                case "result" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Nat8.compare(a.result, b.result)) * dir;
                case "publishedAt" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Utils.compareIntOpt(a.publishedAt, b.publishedAt)) * dir;
                case "createdAt" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "updatedAt" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Utils.compareIntOpt(a.updatedAt, b.updatedAt)) * dir;
                case "categoryId" func(a: Types.Campaign, b: Types.Campaign): Int = 
                    Utils.order2Int(Nat32.compare(a.categoryId, b.categoryId)) * dir;
                case _ {
                    func(a: Types.Campaign, b: Types.Campaign): Int = 0;
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
        ): ?[Table.SortBy<Types.Campaign>] {
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
        ): Result.Result<[Types.Campaign], Text> {
            return campaigns.find(_getCriterias(criterias), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByCategory(
            categoryId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {

            func buildCriterias(categoryId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "categoryId";
                        op = #eq;
                        value = #nat32(categoryId);
                    },
                    {       
                        key = "deletedAt";
                        op = #eq;
                        value = #nil;
                    }                    
                ]
            };
            
            return campaigns.find(buildCriterias(categoryId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByTag(
            tagId: Text,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {

            func buildCriterias(tagId: Text): ?[Table.Criteria] {
                ?[
                    {       
                        key = "tagId";
                        op = #eq;
                        value = #text(tagId);
                    },
                    {       
                        key = "deletedAt";
                        op = #eq;
                        value = #nil;
                    }
                ]
            };
            
            return campaigns.find(buildCriterias(tagId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {

            func buildCriterias(userId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "createdBy";
                        op = #eq;
                        value = #nat32(userId);
                    },
                    {       
                        key = "deletedAt";
                        op = #eq;
                        value = #nil;
                    }
                ]
            };
            
            return campaigns.find(buildCriterias(userId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func onSignatureInserted(
            campaign: Types.Campaign,
            signature: SignatureTypes.Signature
        ) {
            ignore campaigns.replace(campaign._id, _updateEntityWhenSignatureInserted(campaign, signature));
        };

        public func onSignatureDeleted(
            campaign: Types.Campaign,
            signature: SignatureTypes.Signature
        ) {
            ignore campaigns.replace(campaign._id, _updateEntityWhenSignatureDeleted(campaign, signature));
        };

        public func onUpdateInserted(
            campaign: Types.Campaign,
            update: UpdateTypes.Update
        ) {
            ignore campaigns.replace(campaign._id, _updateEntityWhenUpdateInserted(campaign, update));
        };

        public func onUpdateDeleted(
            campaign: Types.Campaign,
            update: UpdateTypes.Update
        ) {
            ignore campaigns.replace(campaign._id, _updateEntityWhenUpdateDeleted(campaign, update));
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return campaigns.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            campaigns.restore(entities);
        };

        func _createEntity(
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Types.Campaign {
            let now: Int = Time.now();
            {
                _id = campaigns.nextId();
                pubId = ulid.next();
                title = req.title;
                target = req.target;
                cover = req.cover;
                body = req.body;
                categoryId = req.categoryId;
                state = Types.STATE_PUBLISHED;
                result = Types.RESULT_NONE;
                duration = req.duration;
                tags = req.tags;
                signaturesCnt = 0;
                firstSignatureAt = null;
                lastSignatureAt = null;
                lastSignatureBy = null;
                signaturers = [];
                updatesCnt = 0;
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
            e: Types.Campaign, 
            req: Types.CampaignRequest,
            callerId: Nat32
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                title = req.title;
                target = req.target;
                cover = req.cover;
                body = req.body;
                categoryId = req.categoryId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = req.tags;
                signaturesCnt = e.signaturesCnt;
                firstSignatureAt = e.firstSignatureAt;
                lastSignatureAt = e.lastSignatureAt;
                lastSignatureBy = e.lastSignatureBy;
                signaturers = e.signaturers;
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };

        func _deleteEntity(
            e: Types.Campaign, 
            callerId: Nat32
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                title = "";
                target = "";
                cover = "";
                body = "";
                categoryId = e.categoryId;
                state = Types.STATE_DELETED;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                signaturesCnt = e.signaturesCnt;
                firstSignatureAt = e.firstSignatureAt;
                lastSignatureAt = e.lastSignatureAt;
                lastSignatureBy = e.lastSignatureBy;
                signaturers = e.signaturers;
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = ?Time.now();
                deletedBy = ?callerId;
            }  
        };

        func _updateEntityWhenSignatureInserted(
            e: Types.Campaign, 
            signature: SignatureTypes.Signature
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                signaturesCnt = e.signaturesCnt + 1;
                firstSignatureAt = switch(e.firstSignatureAt) {case null {?signature.createdAt}; case (?at) {?at};};
                lastSignatureAt = ?signature.createdAt;
                lastSignatureBy = ?signature.createdBy;
                signaturers = Utils.addToArray(e.signaturers, signature.createdBy);
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };        

        func _updateEntityWhenSignatureDeleted(
            e: Types.Campaign, 
            signature: SignatureTypes.Signature
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                signaturesCnt = e.signaturesCnt - (if(e.signaturesCnt > 0) 1 else 0);
                firstSignatureAt = e.firstSignatureAt;
                lastSignatureAt = e.lastSignatureAt;
                lastSignatureBy = e.lastSignatureBy;
                signaturers = Utils.delFromArray(e.signaturers, signature.createdBy, Nat32.equal);
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };     

        func _updateEntityWhenUpdateInserted(
            e: Types.Campaign, 
            update: UpdateTypes.Update
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                signaturesCnt = e.signaturesCnt;
                firstSignatureAt = e.firstSignatureAt;
                lastSignatureAt = e.lastSignatureAt;
                lastSignatureBy = e.lastSignatureBy;
                signaturers = e.signaturers;
                updatesCnt = e.updatesCnt + 1;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };        

        func _updateEntityWhenUpdateDeleted(
            e: Types.Campaign, 
            update: UpdateTypes.Update
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                state = e.state;
                result = e.result;
                duration = e.duration;
                tags = e.tags;
                signaturesCnt = e.signaturesCnt;
                firstSignatureAt = e.firstSignatureAt;
                lastSignatureAt = e.lastSignatureAt;
                lastSignatureBy = e.lastSignatureBy;
                signaturers = e.signaturers;
                updatesCnt = e.updatesCnt - (if(e.updatesCnt > 0) 1 else 0);
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };           

        func _updateEntityWhenFinished(
            e: Types.Campaign, 
            result: Types.CampaignResult,
            callerId: Nat32
        ): Types.Campaign {
            {
                _id = e._id;
                pubId = e.pubId;
                title = e.title;
                target = e.target;
                cover = e.cover;
                body = e.body;
                categoryId = e.categoryId;
                state = Types.STATE_FINISHED;
                result = result;
                duration = e.duration;
                tags = e.tags;
                signaturesCnt = e.signaturesCnt;
                firstSignatureAt = e.firstSignatureAt;
                lastSignatureAt = e.lastSignatureAt;
                lastSignatureBy = e.lastSignatureBy;
                signaturers = e.signaturers;
                updatesCnt = e.updatesCnt;
                publishedAt = e.publishedAt;
                expiredAt = e.expiredAt;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                deletedAt = e.deletedAt;
                deletedBy = e.deletedBy;
            }  
        };        
    };

    func serialize(
        e: Types.Campaign,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);

        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("title", #text(if ignoreCase Utils.toLower(e.title) else e.title));
        res.put("target", #text(if ignoreCase Utils.toLower(e.target) else e.target));
        res.put("cover", #text(e.cover));
        res.put("body", #text(if ignoreCase Utils.toLower(e.body) else e.body));
        res.put("categoryId", #nat32(e.categoryId));
        res.put("state", #nat8(e.state));
        res.put("result", #nat8(e.result));
        res.put("duration", #nat32(e.duration));
        res.put("tags", #array(Array.map(e.tags, func(id: Text): Variant.Variant {#text(id);})));
        res.put("signaturesCnt", #nat32(e.signaturesCnt));
        res.put("firstSignatureAt", switch(e.firstSignatureAt) {case null #nil; case (?firstSignatureAt) #int(firstSignatureAt);});
        res.put("lastSignatureAt", switch(e.lastSignatureAt) {case null #nil; case (?lastSignatureAt) #int(lastSignatureAt);});
        res.put("lastSignatureBy", switch(e.lastSignatureBy) {case null #nil; case (?lastSignatureBy) #nat32(lastSignatureBy);});
        res.put("signaturers", #array(Array.map(e.signaturers, func(signatureerId: Nat32): Variant.Variant {#nat32(signatureerId);})));
        res.put("updatesCnt", #nat32(e.updatesCnt));
        res.put("publishedAt", switch(e.publishedAt) {case null #nil; case (?publishedAt) #int(publishedAt);});
        res.put("expiredAt", switch(e.expiredAt) {case null #nil; case (?expiredAt) #int(expiredAt);});
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});
        res.put("deletedAt", switch(e.deletedAt) {case null #nil; case (?deletedAt) #int(deletedAt);});
        res.put("deletedBy", switch(e.deletedBy) {case null #nil; case (?deletedBy) #nat32(deletedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Campaign {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            title = Variant.getOptText(map.get("title"));
            target = Variant.getOptText(map.get("target"));
            cover = Variant.getOptText(map.get("cover"));
            body = Variant.getOptText(map.get("body"));
            categoryId = Variant.getOptNat32(map.get("categoryId"));
            state = Variant.getOptNat8(map.get("state"));
            result = Variant.getOptNat8(map.get("result"));
            duration = Variant.getOptNat32(map.get("duration"));
            tags = Array.map(Variant.getOptArray(map.get("tags")), Variant.getText);
            signaturesCnt = Variant.getOptNat32(map.get("signaturesCnt"));
            firstSignatureAt = Variant.getOptIntOpt(map.get("firstSignatureAt"));
            lastSignatureAt = Variant.getOptIntOpt(map.get("lastSignatureAt"));
            lastSignatureBy = Variant.getOptNat32Opt(map.get("lastSignatureBy"));
            signaturers = Array.map(Variant.getOptArray(map.get("signaturers")), Variant.getNat32);
            updatesCnt = Variant.getOptNat32(map.get("updatesCnt"));
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