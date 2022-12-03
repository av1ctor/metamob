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
        let fundings = Table.Table<Types.Funding>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("fundings")));

        public func create(
            req: Types.FundingRequest,
            state: Types.FundingState,
            callerId: Nat32
        ): Result.Result<Types.Funding, Text> {
            let e = _createEntity(req, state, callerId);
            switch(fundings.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func complete(
            funding: Types.Funding, 
            value: Nat,
            callerId: Nat32
        ): Result.Result<Types.Funding, Text> {
            let e = _updateEntityWhenCompleted(funding, value, callerId);

            switch(fundings.replace(funding._id, e)) {
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
            funding: Types.Funding, 
            req: Types.FundingRequest,
            callerId: Nat32
        ): Result.Result<Types.Funding, Text> {
            let e = _updateEntity(funding, req, funding.state, callerId);
            switch(fundings.replace(funding._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func moderate(
            funding: Types.Funding,
            req: Types.FundingRequest,
            moderation: ModerationTypes.Moderation,
            callerId: Nat32
        ): Result.Result<Types.Funding, Text> {
            let e = if(moderation.action == ModerationTypes.ACTION_REDACTED) {
                _updateEntityWhenModeratedAndRedacted(funding, req, moderation.reason, callerId);
            }
            else {
                _updateEntityWhenModeratedAndFlagged(funding, moderation.reason, callerId);
            };

            switch(fundings.replace(funding._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func revertModeration(
            campaign: Types.Funding,
            moderation: ModerationTypes.Moderation
        ): Result.Result<Types.Funding, Text> {
            let e = deserialize(Variant.mapToHashMap(moderation.entityOrg));

            switch(fundings.replace(campaign._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func deleteRaw(
            funding: Types.Funding
        ): Result.Result<(), Text> {
            fundings.delete(funding._id);
        };

        public func delete(
            funding: Types.Funding,
            callerId: Nat32
        ): Result.Result<(), Text> {
            switch(fundings.delete(funding._id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case _ {
                    if(funding.state == Types.STATE_COMPLETED) {
                        _updateCampaign(funding, false);
                    };
                    #ok();
                }
            }
        };

        public func insert(
            e: Types.Funding
        ): Result.Result<Types.Funding, Text> {
            switch(fundings.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    if(e.state == Types.STATE_COMPLETED) {
                        _updateCampaign(e, true);
                    };
                    return #ok(e);
                };
            };
        };

        func _updateCampaign(
            funding: Types.Funding,
            inserted: Bool
        ) {
            switch(campaignRepository.findById(funding.campaignId))
            {
                case (#ok(campaign)) {
                    if(inserted) {
                        campaignRepository.onFundingInserted(campaign, funding);
                    }
                    else {
                        campaignRepository.onFundingDeleted(campaign, funding);
                    };
                };
                case _ {
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Funding, Text> {
            switch(fundings.get(_id)) {
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
        ): Result.Result<Types.Funding, Text> {
            switch(fundings.findOne([{
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
        ): Result.Result<Types.Funding, Text> {
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
            
            switch(fundings.findOne(criterias)) {
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
        ): Result.Result<Types.Funding, Text> {
            findByCampaignAndUserEx(campaignId, createdBy, true);
        };

        func _comparer(
            column: Text,
            dir: Int
        ): (Types.Funding, Types.Funding) -> Int {
            switch(column) {
                case "_id" func(a: Types.Funding, b: Types.Funding): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Funding, b: Types.Funding): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Funding, b: Types.Funding): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "campaignId" func(a: Types.Funding, b: Types.Funding): Int = 
                    Utils.order2Int(Nat32.compare(a.campaignId, b.campaignId)) * dir;
                case _ {
                    func(a: Types.Funding, b: Types.Funding): Int = 0;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Funding], Text> {
            return fundings.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Funding>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Funding], Text> {

            let criterias = ?[
                {       
                    key = "campaignId";
                    op = #eq;
                    value = #nat32(campaignId);
                }
            ];
            
            return fundings.find(
                criterias, 
                FilterUtils.toSortBy<Types.Funding>(sortBy, _comparer), 
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
            
            return fundings.count(criterias);
        };

        public func findByUserEx(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            ignoreAnonymous: Bool
        ): Result.Result<[Types.Funding], Text> {

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
            
            return fundings.find(
                criterias, 
                FilterUtils.toSortBy<Types.Funding>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Funding], Text> {
            findByUserEx(userId, sortBy, limit, true);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return fundings.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            fundings.restore(entities);
        };

        func _createEntity(
            req: Types.FundingRequest,
            state: Types.FundingState,
            callerId: Nat32
        ): Types.Funding {
            {
                _id = fundings.nextId();
                pubId = ulid.next();
                state = state;
                anonymous = req.anonymous;
                campaignId = req.campaignId;
                body = req.body;
                tier = req.tier;
                amount = req.amount;
                currency = req.currency;
                value = req.value;
                moderated = ModerationTypes.REASON_NONE;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            e: Types.Funding, 
            req: Types.FundingRequest,
            state: Types.FundingState,
            callerId: Nat32
        ): Types.Funding {
            {
                e
                with
                state = state;
                anonymous = req.anonymous;
                body = req.body;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenCompleted(
            e: Types.Funding, 
            value: Nat,
            callerId: Nat32
        ): Types.Funding {
            {
                e
                with
                state = Types.STATE_COMPLETED;
                value = value;
            }  
        };

        func _updateEntityWhenModeratedAndRedacted(
            e: Types.Funding, 
            req: Types.FundingRequest,
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Funding {
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
            e: Types.Funding, 
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Funding {
            {
                e
                with
                moderated = e.moderated | reason;
            }  
        };
    };

    public func serialize(
        e: Types.Funding,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("state", #nat32(e.state));
        res.put("anonymous", #bool(e.anonymous));
        res.put("campaignId", #nat32(e.campaignId));
        res.put("body", #text(if ignoreCase Utils.toLower(e.body) else e.body));
        res.put("tier", #nat32(e.tier));
        res.put("amount", #nat32(e.amount));
        res.put("currency", #nat32(e.currency));
        res.put("value", #nat(e.value));
        res.put("moderated", #nat32(e.moderated));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Funding {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            state = Variant.getOptNat32(map.get("state"));
            anonymous = Variant.getOptBool(map.get("anonymous"));
            campaignId = Variant.getOptNat32(map.get("campaignId"));
            body = Variant.getOptText(map.get("body"));
            tier = Variant.getOptNat32(map.get("tier"));
            amount = Variant.getOptNat32(map.get("amount"));
            currency = Variant.getOptNat32(map.get("currency"));
            value = Variant.getOptNat(map.get("value"));
            moderated = Variant.getOptNat32(map.get("moderated"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};