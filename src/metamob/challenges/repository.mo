import Array "mo:base/Array";
import Bool "mo:base/Bool";
import EntityTypes "../common/entities";
import FilterUtils "../common/filters";
import HashMap "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
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
    ) {
        let challenges = Table.Table<Types.Challenge>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("challenges")));

        public func create(
            req: Types.ChallengeRequest,
            entityId: Nat32,
            entityType: EntityTypes.EntityType,
            judges: [Nat32],
            dueAt: Int,
            callerId: Nat32
        ): Result.Result<Types.Challenge, Text> {
            let e = _createEntity(req, entityId, entityType, judges, dueAt, callerId);
            switch(challenges.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            challenge: Types.Challenge, 
            req: Types.ChallengeRequest,
            callerId: Nat32
        ): Result.Result<Types.Challenge, Text> {
            let e = _updateEntity(challenge, req, callerId);
            switch(challenges.replace(challenge._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func updateJudges(
            challenge: Types.Challenge, 
            judges: [Nat32],
            dueAt: Int
        ): Result.Result<Types.Challenge, Text> {
            let e = _updateEntityWhenJudgesChanged(challenge, judges, dueAt);
            switch(challenges.replace(challenge._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func vote(
            challenge: Types.Challenge, 
            votes: [Types.ChallengeVote],
            callerId: Nat32
        ): Result.Result<Types.Challenge, Text> {
            let e = _updateEntityWhenVoted(challenge, votes, callerId);
            switch(challenges.replace(challenge._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func close(
            challenge: Types.Challenge, 
            result: Types.ChallengeResult,
            votes: [Types.ChallengeVote],
            callerId: Nat32
        ): Result.Result<Types.Challenge, Text> {
            let e = _updateEntityWhenClosed(challenge, result, votes, callerId);
            switch(challenges.replace(challenge._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Challenge, Text> {
            switch(challenges.get(_id)) {
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
        ): Result.Result<Types.Challenge, Text> {
            switch(challenges.findOne([{
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
        ): (Types.Challenge, Types.Challenge) -> Int {
            switch(column) {
                case "_id" func(a: Types.Challenge, b: Types.Challenge): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Challenge, b: Types.Challenge): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Challenge, b: Types.Challenge): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case _ {
                    func(a: Types.Challenge, b: Types.Challenge): Int = 0;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Challenge], Text> {
            return challenges.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Challenge>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Challenge], Text> {

            let criterias = ?[
                {       
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(userId);
                }
            ];
            
            return challenges.find(
                criterias, 
                FilterUtils.toSortBy<Types.Challenge>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByJudge(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Challenge], Text> {

            let criterias = ?[
                {       
                    key = "judges";
                    op = #eq;
                    value = #nat32(userId);
                }
            ];
            
            return challenges.find(
                criterias, 
                FilterUtils.toSortBy<Types.Challenge>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByEntityAndState(
            entityType: EntityTypes.EntityType,
            entityId: Nat32,
            state: Types.ChallengeState,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Challenge], Text> {

            let criterias = ?[
                {       
                    key = "entityType";
                    op = #eq;
                    value = #nat32(entityType);
                },
                {       
                    key = "entityId";
                    op = #eq;
                    value = #nat32(entityId);
                },
                {
                    key = "state";
                    op = #eq;
                    value = #nat32(state);
                }
            ];
            
            return challenges.find(
                criterias, 
                FilterUtils.toSortBy<Types.Challenge>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findDue(
            size: Nat
        ): Result.Result<[Types.Challenge], Text> {

            let criterias = ?[
                {
                    key = "state";
                    op = #eq;
                    value = #nat32(Types.STATE_VOTING);
                },
                {       
                    key = "dueAt";
                    op = #lte;
                    value = #int(Time.now());
                }                    
            ];
            
            return challenges.find(
                criterias, 
                null, 
                ?{offset = 0; size = size;}
            );
        };
        
        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return challenges.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            challenges.restore(entities);
        };

        func _createEntity(
            req: Types.ChallengeRequest,
            entityId: Nat32,
            entityType: EntityTypes.EntityType,
            judges: [Nat32],
            dueAt: Int,
            callerId: Nat32
        ): Types.Challenge {
            {
                _id = challenges.nextId();
                pubId = ulid.next();
                state = Types.STATE_VOTING;
                moderationId = req.moderationId;
                entityId = entityId;
                entityType = entityType;
                description = req.description;
                judges = judges;
                votes = [];
                result = Types.RESULT_NONE;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
                dueAt = dueAt;
            }
        };

        func _updateEntity(
            e: Types.Challenge, 
            req: Types.ChallengeRequest,
            callerId: Nat32
        ): Types.Challenge {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                moderationId = e.moderationId;
                entityId = e.entityId;
                entityType = e.entityType;
                description = req.description;
                judges = e.judges;
                votes = e.votes;
                result = e.result;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                dueAt = e.dueAt;
            }  
        };

        func _updateEntityWhenJudgesChanged(
            e: Types.Challenge, 
            judges: [Nat32],
            dueAt: Int
        ): Types.Challenge {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                moderationId = e.moderationId;
                entityId = e.entityId;
                entityType = e.entityType;
                description = e.description;
                judges = judges;
                votes = e.votes;
                result = e.result;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                dueAt = dueAt;
            }  
        };

        func _updateEntityWhenVoted(
            e: Types.Challenge, 
            votes: [Types.ChallengeVote],
            callerId: Nat32
        ): Types.Challenge {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                moderationId = e.moderationId;
                entityId = e.entityId;
                entityType = e.entityType;
                description = e.description;
                judges = e.judges;
                votes = votes;
                result = e.result;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                dueAt = e.dueAt;
            }  
        };
        
        func _updateEntityWhenClosed(
            e: Types.Challenge, 
            result: Types.ChallengeResult,
            votes: [Types.ChallengeVote],
            callerId: Nat32
        ): Types.Challenge {
            {
                _id = e._id;
                pubId = e.pubId;
                state = Types.STATE_CLOSED;
                moderationId = e.moderationId;
                entityId = e.entityId;
                entityType = e.entityType;
                description = e.description;
                judges = e.judges;
                votes = votes;
                result = result;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                dueAt = e.dueAt;
            }  
        };
    };

    func serialize(
        e: Types.Challenge,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("state", #nat32(e.state));
        res.put("moderationId", #nat32(e.moderationId));
        res.put("entityId", #nat32(e.entityId));
        res.put("entityType", #nat32(e.entityType));
        res.put("description", #text(if ignoreCase Utils.toLower(e.description) else e.description));
        res.put("judges", #array(Array.map(e.judges, func (id: Nat32): Variant.Variant = #nat32(id))));
        res.put("votes", #array(Array.map(e.votes, 
            func (v: Types.ChallengeVote): Variant.Variant = 
                #map([
                    {key = "judgeId"; value = #nat32(v.judgeId);},
                    {key = "pro"; value = #bool(v.pro);},
                    {key = "reason"; value = #text(v.reason);}
                ])
        )));
        res.put("result", #nat32(e.result));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});
        res.put("dueAt", #int(e.dueAt));

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Challenge {
        let votes = Array.map(Variant.getOptArray(map.get("votes")), Variant.getMapAsHM);

        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            state = Variant.getOptNat32(map.get("state"));
            moderationId = Variant.getOptNat32(map.get("moderationId"));
            entityId = Variant.getOptNat32(map.get("entityId"));
            entityType = Variant.getOptNat32(map.get("entityType"));
            description = Variant.getOptText(map.get("description"));
            judges = Array.map(Variant.getOptArray(map.get("judges")), Variant.getNat32);
            votes = Array.map(votes, func (vote: HashMap.HashMap<Text, Variant.Variant>): Types.ChallengeVote {
                {
                    judgeId = Variant.getOptNat32(vote.get("judgeId"));
                    pro = Variant.getOptBool(vote.get("pro"));
                    reason = Variant.getOptText(vote.get("reason"));
                }
            });
            result = Variant.getOptNat32(map.get("result"));            
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
            dueAt = Variant.getOptInt(map.get("dueAt"));
        }
    };
};