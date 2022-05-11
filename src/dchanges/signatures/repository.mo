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
        let signatures = Table.Table<Types.Signature>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("signatures")));

        public func create(
            req: Types.SignatureRequest,
            callerId: Nat32
        ): Result.Result<Types.Signature, Text> {
            let e = _createEntity(req, callerId);
            switch(signatures.insert(e._id, e)) {
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
            signature: Types.Signature, 
            req: Types.SignatureRequest,
            callerId: Nat32
        ): Result.Result<Types.Signature, Text> {
            let e = _updateEntity(signature, req, callerId);
            switch(signatures.replace(signature._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            signature: Types.Signature,
            callerId: Nat32
        ): Result.Result<(), Text> {
            switch(signatures.delete(signature._id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case _ {
                    _updateCampaign(signature, false);
                    #ok();
                }
            }
        };

        func _updateCampaign(
            signature: Types.Signature,
            inc: Bool
        ) {
            switch(campaignRepository.findById(signature.campaignId))
            {
                case (#ok(campaign)) {
                    if(inc) {
                        campaignRepository.onSignatureInserted(campaign, signature);
                    }
                    else {
                        campaignRepository.onSignatureDeleted(campaign, signature);
                    };
                };
                case _ {
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Signature, Text> {
            switch(signatures.get(_id)) {
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
        ): Result.Result<Types.Signature, Text> {
            switch(signatures.findOne([{
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

        public func findByCampaignAndUser(
            campaignId: Nat32,
            createdBy: Nat32
        ): Result.Result<Types.Signature, Text> {
            switch(signatures.findOne([
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
        ): (Types.Signature, Types.Signature) -> Int {
            switch(column) {
                case "_id" func(a: Types.Signature, b: Types.Signature): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Signature, b: Types.Signature): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Signature, b: Types.Signature): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "campaignId" func(a: Types.Signature, b: Types.Signature): Int = 
                    Utils.order2Int(Nat32.compare(a.campaignId, b.campaignId)) * dir;
                case _ {
                    func(a: Types.Signature, b: Types.Signature): Int = 0;
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
        ): ?[Table.SortBy<Types.Signature>] {
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
        ): Result.Result<[Types.Signature], Text> {
            return signatures.find(_getCriterias(criterias), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {

            func buildCriterias(campaignId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "campaignId";
                        op = #eq;
                        value = #nat32(campaignId);
                    }
                ]
            };
            
            return signatures.find(buildCriterias(campaignId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
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
            
            return signatures.count(buildCriterias(campaignId));
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {

            func buildCriterias(userId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "createdBy";
                        op = #eq;
                        value = #nat32(userId);
                    }
                ]
            };
            
            return signatures.find(buildCriterias(userId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return signatures.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            signatures.restore(entities);
        };

        func _createEntity(
            req: Types.SignatureRequest,
            callerId: Nat32
        ): Types.Signature {
            {
                _id = signatures.nextId();
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
            e: Types.Signature, 
            req: Types.SignatureRequest,
            callerId: Nat32
        ): Types.Signature {
            {
                _id = e._id;
                pubId = e.pubId;
                body = req.body;
                campaignId = e.campaignId;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };
    };

    func serialize(
        e: Types.Signature,
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
    ): Types.Signature {
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