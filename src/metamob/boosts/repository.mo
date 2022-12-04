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

module {
    public class Repository(
        campaignRepository: CampaignRepository.Repository
    ) {
        let boosts = Table.Table<Types.Boost>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("boosts")));

        public func create(
            req: Types.BoostRequest,
            state: Types.BoostState,
            callerId: Nat32
        ): Result.Result<Types.Boost, Text> {
            let e = _createEntity(req, state, callerId);
            switch(boosts.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func complete(
            boost: Types.Boost, 
            valueInIcp: Nat,
            callerId: Nat32
        ): Result.Result<Types.Boost, Text> {
            let e = _updateEntityWhenCompleted(boost, callerId);

            switch(boosts.replace(boost._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    _updateCampaign(e, valueInIcp);
                    return #ok(e);
                };
            };
        };

        public func update(
            boost: Types.Boost, 
            req: Types.BoostRequest,
            callerId: Nat32
        ): Result.Result<Types.Boost, Text> {
            let e = _updateEntity(boost, req, boost.state, callerId);
            switch(boosts.replace(boost._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func insert(
            e: Types.Boost,
            value: Nat
        ): Result.Result<Types.Boost, Text> {
            switch(boosts.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    if(e.state == Types.STATE_COMPLETED) {
                        _updateCampaign(e, value);
                    };
                    return #ok(e);
                };
            };
        };

        func _updateCampaign(
            boost: Types.Boost,
            valueInIcp: Nat
        ) {
            switch(campaignRepository.findById(boost.campaignId))
            {
                case (#ok(campaign)) {
                    campaignRepository.onBoostInserted(campaign, valueInIcp);
                };
                case _ {
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Boost, Text> {
            switch(boosts.get(_id)) {
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
        ): Result.Result<Types.Boost, Text> {
            switch(boosts.findOne([{
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
        ): Result.Result<Types.Boost, Text> {
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
            
            switch(boosts.findOne(criterias)) {
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
        ): Result.Result<Types.Boost, Text> {
            findByCampaignAndUserEx(campaignId, createdBy, true);
        };

        func _comparer(
            column: Text,
            dir: Int
        ): (Types.Boost, Types.Boost) -> Int {
            switch(column) {
                case "_id" func(a: Types.Boost, b: Types.Boost): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Boost, b: Types.Boost): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Boost, b: Types.Boost): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "campaignId" func(a: Types.Boost, b: Types.Boost): Int = 
                    Utils.order2Int(Nat32.compare(a.campaignId, b.campaignId)) * dir;
                case _ {
                    func(a: Types.Boost, b: Types.Boost): Int = 0;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Boost], Text> {
            return boosts.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Boost>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Boost], Text> {

            let criterias = ?[
                {       
                    key = "campaignId";
                    op = #eq;
                    value = #nat32(campaignId);
                }
            ];
            
            return boosts.find(
                criterias, 
                FilterUtils.toSortBy<Types.Boost>(sortBy, _comparer), 
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
            
            return boosts.count(criterias);
        };

        public func findByUserEx(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            ignoreAnonymous: Bool
        ): Result.Result<[Types.Boost], Text> {

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
            
            return boosts.find(
                criterias, 
                FilterUtils.toSortBy<Types.Boost>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Boost], Text> {
            findByUserEx(userId, sortBy, limit, true);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return boosts.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            boosts.restore(entities);
        };

        func _createEntity(
            req: Types.BoostRequest,
            state: Types.BoostState,
            callerId: Nat32
        ): Types.Boost {
            {
                _id = boosts.nextId();
                pubId = ulid.next();
                state = state;
                anonymous = req.anonymous;
                campaignId = req.campaignId;
                currency = req.currency;
                value = req.value;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            e: Types.Boost, 
            req: Types.BoostRequest,
            state: Types.BoostState,
            callerId: Nat32
        ): Types.Boost {
            {
                e
                with
                state = state;
                anonymous = req.anonymous;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenCompleted(
            e: Types.Boost, 
            callerId: Nat32
        ): Types.Boost {
            {
                e
                with
                state = Types.STATE_COMPLETED;
            }  
        };
    };

    public func serialize(
        e: Types.Boost,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("state", #nat32(e.state));
        res.put("anonymous", #bool(e.anonymous));
        res.put("campaignId", #nat32(e.campaignId));
        res.put("currency", #nat32(e.currency));
        res.put("value", #nat(e.value));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Boost {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            state = Variant.getOptNat32(map.get("state"));
            anonymous = Variant.getOptBool(map.get("anonymous"));
            campaignId = Variant.getOptNat32(map.get("campaignId"));
            currency = Variant.getOptNat32(map.get("currency"));
            value = Variant.getOptNat(map.get("value"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};