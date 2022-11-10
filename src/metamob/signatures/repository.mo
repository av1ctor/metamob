import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Bool "mo:base/Bool";
import CampaignRepository "../campaigns/repository";
import Debug "mo:base/Debug";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Options "mo:base/Option";
import Principal "mo:base/Principal";
import Random "../common/random";
import Result "mo:base/Result";
import Schema "./schema";
import Table "mo:mo-table/table";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Types "./types";
import ULID "../common/ulid";
import Utils "../common/utils";
import FilterUtils "../common/filters";
import Variant "mo:mo-table/variant";
import ModerationTypes "../moderations/types";

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

        public func moderate(
            signature: Types.Signature, 
            req: Types.SignatureRequest,
            moderation: ModerationTypes.Moderation,
            callerId: Nat32
        ): Result.Result<Types.Signature, Text> {
            let e = if(moderation.action == ModerationTypes.ACTION_REDACTED) {
                _updateEntityWhenModeratedAndRedacted(signature, req, moderation.reason, callerId);
            }
            else {
                _updateEntityWhenModeratedAndFlagged(signature, moderation.reason, callerId);
            };

            switch(signatures.replace(signature._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func revertModeration(
            campaign: Types.Signature,
            moderation: ModerationTypes.Moderation
        ): Result.Result<Types.Signature, Text> {
            let e = deserialize(Variant.mapToHashMap(moderation.entityOrg));

            switch(signatures.replace(campaign._id, e)) {
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
        
        public func findByCampaignAndUserEx(
            campaignId: Nat32,
            createdBy: Nat32,
            ignoreAnonymous: Bool
        ): Result.Result<Types.Signature, Text> {
            let criterias = switch(ignoreAnonymous) {
                case true {
                    [
                        {
                            key = "campaignId";
                            op = #eq;
                            value = #nat32(campaignId);
                        },
                        {
                            key = "createdBy";
                            op = #eq;
                            value = #nat32(createdBy);
                        },
                        {
                            key = "anonymous";
                            op = #eq;
                            value = #bool(false);
                        }
                    ];
                };
                case _ {
                    [
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
                    ];
                };
            };
            
            switch(signatures.findOne(criterias)) {
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
            findByCampaignAndUserEx(campaignId, createdBy, true);
        };

        func _comparer(
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
        
        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {
            return signatures.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Signature>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {

            let criterias = ?[
                {       
                    key = "campaignId";
                    op = #eq;
                    value = #nat32(campaignId);
                }
            ];
            
            return signatures.find(
                criterias, 
                FilterUtils.toSortBy<Types.Signature>(sortBy, _comparer), 
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
            
            return signatures.count(criterias);
        };

        public func findByUserEx(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            ignoreAnonymous: Bool
        ): Result.Result<[Types.Signature], Text> {

            let criterias = switch(ignoreAnonymous) {
                case true {
                    ?[
                        {  
                            key = "createdBy";
                            op = #eq;
                            value = #nat32(userId);
                        },
                        {  
                            key = "anonymous";
                            op = #eq;
                            value = #bool(false);
                        }
                    ];
                };
                case _ {
                    ?[
                        {  
                            key = "createdBy";
                            op = #eq;
                            value = #nat32(userId);
                        }
                    ];
                };
            };
            
            return signatures.find(
                criterias, 
                FilterUtils.toSortBy<Types.Signature>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {
            findByUserEx(userId, sortBy, limit, true);
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
                anonymous = req.anonymous;
                campaignId = req.campaignId;
                moderated = ModerationTypes.REASON_NONE;
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
                e
                with
                body = req.body;
                anonymous = req.anonymous;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModeratedAndRedacted(
            e: Types.Signature, 
            req: Types.SignatureRequest,
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Signature {
            {
                e
                with
                body = req.body;
                moderated = e.moderated | reason;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModeratedAndFlagged(
            e: Types.Signature, 
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Signature {
            {
                e
                with
                moderated = e.moderated | reason;
            }  
        };
    };

    public func serialize(
        e: Types.Signature,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("body", #text(if ignoreCase Utils.toLower(e.body) else e.body));
        res.put("anonymous", #bool(e.anonymous));
        res.put("campaignId", #nat32(e.campaignId));
        res.put("moderated", #nat32(e.moderated));
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
            anonymous = Variant.getOptBool(map.get("anonymous"));
            campaignId = Variant.getOptNat32(map.get("campaignId"));
            moderated = Variant.getOptNat32(map.get("moderated"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};