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
import FilterUtils "../common/filters";
import Variant "mo:mo-table/variant";
import ModerationTypes "../moderations/types";

module {
    public class Repository(
        campaignRepository: CampaignRepository.Repository
    ) {
        let votes = Table.Table<Types.Vote>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("votes")));

        private type CampaignUpdateKind = {
            #inserted;
            #deleted;
        };

        public func create(
            req: Types.VoteRequest,
            callerId: Nat32
        ): Result.Result<Types.Vote, Text> {
            let e = _createEntity(req, callerId);
            switch(votes.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    _updateCampaign(e, #inserted);
                    return #ok(e);
                };
            };
        };

        public func update(
            vote: Types.Vote, 
            req: Types.VoteRequest,
            callerId: Nat32
        ): Result.Result<Types.Vote, Text> {
            let e = _updateEntity(vote, req, callerId);
            switch(votes.replace(vote._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func moderate(
            vote: Types.Vote, 
            req: Types.VoteRequest,
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Result.Result<Types.Vote, Text> {
            let e = _updateEntityWhenModerated(vote, req, reason, callerId);

            switch(votes.replace(vote._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            vote: Types.Vote,
            callerId: Nat32
        ): Result.Result<(), Text> {
            switch(votes.delete(vote._id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case _ {
                    _updateCampaign(vote, #deleted);
                    #ok();
                }
            }
        };

        func _updateCampaign(
            vote: Types.Vote,
            kind: CampaignUpdateKind
        ) {
            switch(campaignRepository.findById(vote.campaignId))
            {
                case (#ok(campaign)) {
                    switch(kind) {
                        case (#inserted) {
                            campaignRepository.onVoteInserted(campaign, vote);
                        };
                        case (#deleted) {
                            campaignRepository.onVoteDeleted(campaign, vote);
                        };
                    };
                };
                case _ {
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Vote, Text> {
            switch(votes.get(_id)) {
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
        ): Result.Result<Types.Vote, Text> {
            switch(votes.findOne([{
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
        ): Result.Result<Types.Vote, Text> {
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
            
            switch(votes.findOne(criterias)) {
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
        ): Result.Result<Types.Vote, Text> {
            findByCampaignAndUserEx(campaignId, createdBy, true);
        };

        func _comparer(
            column: Text,
            dir: Int
        ): (Types.Vote, Types.Vote) -> Int {
            switch(column) {
                case "_id" func(a: Types.Vote, b: Types.Vote): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Vote, b: Types.Vote): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Vote, b: Types.Vote): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "campaignId" func(a: Types.Vote, b: Types.Vote): Int = 
                    Utils.order2Int(Nat32.compare(a.campaignId, b.campaignId)) * dir;
                case _ {
                    func(a: Types.Vote, b: Types.Vote): Int = 0;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Vote], Text> {
            return votes.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Vote>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Vote], Text> {

            let criterias = ?[
                {       
                    key = "campaignId";
                    op = #eq;
                    value = #nat32(campaignId);
                }
            ];
            
            return votes.find(
                criterias, 
                FilterUtils.toSortBy<Types.Vote>(sortBy, _comparer), 
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
            
            return votes.count(criterias);
        };

        public func findByUserEx(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            ignoreAnonymous: Bool
        ): Result.Result<[Types.Vote], Text> {

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
            
            return votes.find(
                criterias, 
                FilterUtils.toSortBy<Types.Vote>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Vote], Text> {
            findByUserEx(userId, sortBy, limit, true);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return votes.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            votes.restore(entities);
        };

        func _createEntity(
            req: Types.VoteRequest,
            callerId: Nat32
        ): Types.Vote {
            {
                _id = votes.nextId();
                pubId = ulid.next();
                anonymous = req.anonymous;
                campaignId = req.campaignId;
                body = req.body;
                pro = req.pro;
                weight = 1;
                moderated = ModerationTypes.REASON_NONE;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            e: Types.Vote, 
            req: Types.VoteRequest,
            callerId: Nat32
        ): Types.Vote {
            {
                _id = e._id;
                pubId = e.pubId;
                anonymous = req.anonymous;
                campaignId = e.campaignId;
                body = req.body;
                pro = req.pro;
                weight = e.weight;
                moderated = e.moderated;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModerated(
            e: Types.Vote, 
            req: Types.VoteRequest,
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Vote {
            {
                _id = e._id;
                pubId = e.pubId;
                anonymous = req.anonymous;
                campaignId = e.campaignId;
                body = req.body;
                pro = req.pro;
                weight = e.weight;
                moderated = e.moderated | reason;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };
    };

    func serialize(
        e: Types.Vote,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("anonymous", #bool(e.anonymous));
        res.put("campaignId", #nat32(e.campaignId));
        res.put("body", #text(if ignoreCase Utils.toLower(e.body) else e.body));
        res.put("pro", #bool(e.pro));
        res.put("weight", #nat(e.weight));
        res.put("moderated", #nat32(e.moderated));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Vote {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            anonymous = Variant.getOptBool(map.get("anonymous"));
            campaignId = Variant.getOptNat32(map.get("campaignId"));
            body = Variant.getOptText(map.get("body"));
            pro = Variant.getOptBool(map.get("pro"));
            weight = Variant.getOptNat(map.get("weight"));
            moderated = Variant.getOptNat32(map.get("moderated"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};