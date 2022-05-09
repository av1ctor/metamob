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
import CampaignRepository "../campaigns/repository";
import Debug "mo:base/Debug";

module {
    public class Repository(
        campaignRepository: CampaignRepository.Repository
    ) {
        let updates = Table.Table<Types.Update>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("updates")));

        public func create(
            req: Types.UpdateRequest,
            callerId: Nat32
        ): Result.Result<Types.Update, Text> {
            let update = _createEntity(req, callerId);
            switch(updates.insert(update._id, update)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    _updateCampaign(update, true);
                    return #ok(update);
                };
            };
        };

        public func update(
            update: Types.Update, 
            req: Types.UpdateRequest,
            callerId: Nat32
        ): Result.Result<Types.Update, Text> {
            let e = _updateEntity(update, req, callerId);
            switch(updates.replace(update._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            update: Types.Update,
            callerId: Nat32
        ): Result.Result<(), Text> {
            let e = _deleteEntity(update, callerId);
            switch(updates.replace(update._id, e)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case _ {
                    _updateCampaign(update, false);
                    #ok();
                }
            }
        };

        func _updateCampaign(
            update: Types.Update,
            inc: Bool
        ) {
            switch(campaignRepository.findById(update.campaignId))
            {
                case (#ok(campaign)) {
                    if(inc) {
                        campaignRepository.onUpdateInserted(campaign, update);
                    }
                    else {
                        campaignRepository.onUpdateDeleted(campaign, update);
                    };
                };
                case _ {
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Update, Text> {
            switch(updates.get(_id)) {
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
        ): Result.Result<Types.Update, Text> {
            switch(updates.findOne([{
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

        public func findByCampaignAndUser(
            campaignId: Nat32,
            createdBy: Nat32
        ): Result.Result<Types.Update, Text> {
            switch(updates.findOne([
                {
                    key = "campaignId";
                    op = #eq;
                    value = #nat32(campaignId);
                },
                {
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(createdBy);
                }
            ])) {
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
        ): (Types.Update, Types.Update) -> Int {
            switch(column) {
                case "_id" func(a: Types.Update, b: Types.Update): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Update, b: Types.Update): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Update, b: Types.Update): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "campaignId" func(a: Types.Update, b: Types.Update): Int = 
                    Utils.order2Int(Nat32.compare(a.campaignId, b.campaignId)) * dir;
                case _ {
                    func(a: Types.Update, b: Types.Update): Int = 0;
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
        ): ?[Table.SortBy<Types.Update>] {
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
        ): Result.Result<[Types.Update], Text> {
            return updates.find(_getCriterias(criterias), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Update], Text> {

            func buildCriterias(campaignId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "campaignId";
                        op = #eq;
                        value = #nat32(campaignId);
                    }
                ]
            };
            
            return updates.find(buildCriterias(campaignId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func countByCampaign(
            campaignId: Nat32
        ): Result.Result<Nat, Text> {

            func buildCriterias(campaignId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "campaignId";
                        op = #eq;
                        value = #nat32(campaignId);
                    }
                ]
            };
            
            return updates.count(buildCriterias(campaignId));
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Update], Text> {

            func buildCriterias(userId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "createdBy";
                        op = #eq;
                        value = #nat32(userId);
                    }
                ]
            };
            
            return updates.find(buildCriterias(userId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return updates.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            updates.restore(entities);
        };

        func _createEntity(
            req: Types.UpdateRequest,
            callerId: Nat32
        ): Types.Update {
            {
                _id = updates.nextId();
                pubId = ulid.next();
                body = req.body;
                campaignId = req.campaignId;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            update: Types.Update, 
            req: Types.UpdateRequest,
            callerId: Nat32
        ): Types.Update {
            {
                _id = update._id;
                pubId = update.pubId;
                body = req.body;
                campaignId = req.campaignId;
                createdAt = update.createdAt;
                createdBy = update.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _deleteEntity(
            update: Types.Update, 
            callerId: Nat32
        ): Types.Update {
            {
                _id = update._id;
                pubId = update.pubId;
                body = "";
                campaignId = update.campaignId;
                createdAt = update.createdAt;
                createdBy = update.createdBy;
                updatedAt = update.updatedAt;
                updatedBy = update.updatedBy;
                deletedAt = ?Time.now();
                deletedBy = ?callerId;
            }  
        };
    };

    func serialize(
        entity: Types.Update,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(entity._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(entity.pubId) else entity.pubId));
        res.put("body", #text(if ignoreCase Utils.toLower(entity.body) else entity.body));
        res.put("campaignId", #nat32(entity.campaignId));
        res.put("createdAt", #int(entity.createdAt));
        res.put("createdBy", #nat32(entity.createdBy));
        res.put("updatedAt", switch(entity.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(entity.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Update {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            body = Variant.getOptText(map.get("body"));
            campaignId = Variant.getOptNat32(map.get("campaignId"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};