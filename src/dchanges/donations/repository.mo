import Array "mo:base/Array";
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
import Variant "mo:mo-table/variant";

module {
    public class Repository(
        campaignRepository: CampaignRepository.Repository
    ) {
        let donations = Table.Table<Types.Donation>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("donations")));

        public func create(
            req: Types.DonationRequest,
            state: Types.DonationState,
            callerId: Nat32
        ): Result.Result<Types.Donation, Text> {
            let e = _createEntity(req, state, callerId);
            switch(donations.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func complete(
            donation: Types.Donation, 
            value: Nat,
            callerId: Nat32
        ): Result.Result<Types.Donation, Text> {
            let e = _updateEntity(
                donation, 
                {
                    campaignId = donation.campaignId;
                    anonymous = donation.anonymous;
                    body = donation.body;
                    value = value;
                }, 
                Types.STATE_COMPLETED, 
                callerId
            );

            switch(donations.replace(donation._id, e)) {
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
            donation: Types.Donation, 
            req: Types.DonationRequest,
            callerId: Nat32
        ): Result.Result<Types.Donation, Text> {
            let e = _updateEntity(donation, req, donation.state, callerId);
            switch(donations.replace(donation._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            donation: Types.Donation,
            callerId: Nat32
        ): Result.Result<(), Text> {
            switch(donations.delete(donation._id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case _ {
                    _updateCampaign(donation, false);
                    #ok();
                }
            }
        };

        func _updateCampaign(
            donation: Types.Donation,
            inc: Bool
        ) {
            switch(campaignRepository.findById(donation.campaignId))
            {
                case (#ok(campaign)) {
                    if(inc) {
                        campaignRepository.onDonationInserted(campaign, donation);
                    }
                    else {
                        campaignRepository.onDonationDeleted(campaign, donation);
                    };
                };
                case _ {
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Donation, Text> {
            switch(donations.get(_id)) {
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
        ): Result.Result<Types.Donation, Text> {
            switch(donations.findOne([{
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
        ): Result.Result<Types.Donation, Text> {
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
            
            switch(donations.findOne(criterias)) {
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
        ): Result.Result<Types.Donation, Text> {
            findByCampaignAndUserEx(campaignId, createdBy, true);
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
        ): (Types.Donation, Types.Donation) -> Int {
            switch(column) {
                case "_id" func(a: Types.Donation, b: Types.Donation): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Donation, b: Types.Donation): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Donation, b: Types.Donation): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "campaignId" func(a: Types.Donation, b: Types.Donation): Int = 
                    Utils.order2Int(Nat32.compare(a.campaignId, b.campaignId)) * dir;
                case _ {
                    func(a: Types.Donation, b: Types.Donation): Int = 0;
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
        ): ?[Table.SortBy<Types.Donation>] {
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
        ): Result.Result<[Types.Donation], Text> {
            return donations.find(_getCriterias(criterias), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Donation], Text> {

            let criterias = ?[
                {       
                    key = "campaignId";
                    op = #eq;
                    value = #nat32(campaignId);
                }
            ];
            
            return donations.find(criterias, _getSortBy(sortBy), _getLimit(limit)/*, null*/);
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
            
            return donations.count(criterias);
        };

        public func findByUserEx(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat),
            ignoreAnonymous: Bool
        ): Result.Result<[Types.Donation], Text> {

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
            
            return donations.find(criterias, _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Donation], Text> {
            findByUserEx(userId, sortBy, limit, true);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return donations.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            donations.restore(entities);
        };

        func _createEntity(
            req: Types.DonationRequest,
            state: Types.DonationState,
            callerId: Nat32
        ): Types.Donation {
            {
                _id = donations.nextId();
                pubId = ulid.next();
                state = state;
                anonymous = req.anonymous;
                campaignId = req.campaignId;
                body = req.body;
                value = req.value;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            e: Types.Donation, 
            req: Types.DonationRequest,
            state: Types.DonationState,
            callerId: Nat32
        ): Types.Donation {
            {
                _id = e._id;
                pubId = e.pubId;
                state = state;
                anonymous = req.anonymous;
                campaignId = e.campaignId;
                body = req.body;
                value = req.value;                
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };
    };

    func serialize(
        e: Types.Donation,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("state", #nat32(e.state));
        res.put("anonymous", #bool(e.anonymous));
        res.put("campaignId", #nat32(e.campaignId));
        res.put("body", #text(if ignoreCase Utils.toLower(e.body) else e.body));
        res.put("value", #nat(e.value));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Donation {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            state = Variant.getOptNat32(map.get("state"));
            anonymous = Variant.getOptBool(map.get("anonymous"));
            campaignId = Variant.getOptNat32(map.get("campaignId"));
            body = Variant.getOptText(map.get("body"));
            value = Variant.getOptNat(map.get("value"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};