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
import FilterUtils "../common/filters";
import Types "./types";
import Schema "./schema";
import CampaignRepository "../campaigns/repository";

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
            let e = _createEntity(req, callerId);
            switch(updates.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    _updateCampaign(e, true);
                    return #ok(e);
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
            switch(updates.delete(update._id)) {
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
                case (#ok(e)) {
                    switch(e) {
                        case null {
                            return #err("Not found");
                        };
                        case (?e) {
                            return #ok(e);
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
                case (#ok(e)) {
                    switch(e) {
                        case null {
                            return #err("Not found");
                        };
                        case (?e) {
                            return #ok(e);
                        };
                    };
                };
            };
        };

        func _comparer(
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

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Update], Text> {
            return updates.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Update>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)/*, null*/
            );
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Update], Text> {

            let criterias = ?[
                {       
                    key = "campaignId";
                    op = #eq;
                    value = #nat32(campaignId);
                }
            ];
            
            return updates.find(
                criterias, 
                FilterUtils.toSortBy<Types.Update>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func countByCampaign(
            campaignId: Nat32
        ): Result.Result<Nat, Text> {

            let criterias = ?[
                {       
                    key = "campaignId";
                    op = #eq;
                    value = #nat32(campaignId);
                }
            ];
            
            return updates.count(criterias);
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Update], Text> {

            let criterias = ?[
                {       
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(userId);
                }
            ];
            
            return updates.find(
                criterias, 
                FilterUtils.toSortBy<Types.Update>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
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
            e: Types.Update, 
            req: Types.UpdateRequest,
            callerId: Nat32
        ): Types.Update {
            {
                _id = e._id;
                pubId = e.pubId;
                body = req.body;
                campaignId = req.campaignId;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };
    };

    func serialize(
        e: Types.Update,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("body", #text(if ignoreCase Utils.toLower(e.body) else e.body));
        res.put("campaignId", #nat32(e.campaignId));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

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