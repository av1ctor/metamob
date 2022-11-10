import Array "mo:base/Array";
import Bool "mo:base/Bool";
import ChallengeResult "../challenges/types";
import ChallengeTypes "../challenges/types";
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
import ReportTypes "../reports/types";
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
        let moderations = Table.Table<Types.Moderation>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("moderations")));

        public func create(
            req: Types.ModerationRequest,
            report: ReportTypes.Report,
            original: [Variant.MapEntry],
            callerId: Nat32
        ): Result.Result<Types.Moderation, Text> {
            let e = _createEntity(req, report, original, callerId);
            switch(moderations.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            moderation: Types.Moderation, 
            req: Types.ModerationRequest,
            callerId: Nat32
        ): Result.Result<Types.Moderation, Text> {
            let e = _updateEntity(moderation, req, callerId);
            switch(moderations.replace(moderation._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func challenge(
            moderation: Types.Moderation, 
            challengeId: Nat32,
            callerId: Nat32
        ): Result.Result<Types.Moderation, Text> {
            let e = _updateEntityWhenChallenged(moderation, challengeId, callerId);
            switch(moderations.replace(moderation._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func closeChallenge(
            moderation: Types.Moderation, 
            result: ChallengeTypes.ChallengeResult
        ): Result.Result<Types.Moderation, Text> {
            let e = _updateEntityWhenChallengeClosed(moderation, result);
            switch(moderations.replace(moderation._id, e)) {
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
        ): Result.Result<Types.Moderation, Text> {
            switch(moderations.get(_id)) {
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
        ): Result.Result<Types.Moderation, Text> {
            switch(moderations.findOne([{
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

        public func findByEntity(
            entityType: EntityTypes.EntityType,
            entityId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Moderation], Text> {

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
                }
            ];
            
            return moderations.find(
                criterias, 
                FilterUtils.toSortBy<Types.Moderation>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        func _comparer(
            column: Text,
            dir: Int
        ): (Types.Moderation, Types.Moderation) -> Int {
            switch(column) {
                case "_id" func(a: Types.Moderation, b: Types.Moderation): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Moderation, b: Types.Moderation): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Moderation, b: Types.Moderation): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "entityId" func(a: Types.Moderation, b: Types.Moderation): Int = 
                    Utils.order2Int(Nat32.compare(a.entityId, b.entityId)) * dir;
                case _ {
                    func(a: Types.Moderation, b: Types.Moderation): Int = 0;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Moderation], Text> {
            return moderations.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Moderation>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return moderations.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            moderations.restore(entities);
        };

        func _createEntity(
            req: Types.ModerationRequest,
            report: ReportTypes.Report,
            original: [Variant.MapEntry],
            callerId: Nat32
        ): Types.Moderation {
            {
                _id = moderations.nextId();
                pubId = ulid.next();
                state = Types.STATE_CREATED;
                reason = req.reason;
                action = req.action;
                body = req.body;
                reportId = report._id;
                entityType = report.entityType;
                entityId = report.entityId;
                entityPubId = report.entityPubId;
                entityOrg = original;
                challengeId = null;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            e: Types.Moderation, 
            req: Types.ModerationRequest,
            callerId: Nat32
        ): Types.Moderation {
            {
                e
                with
                reason = req.reason;
                action = req.action;
                body = req.body;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenChallenged(
            e: Types.Moderation, 
            challengeId: Nat32,
            callerId: Nat32
        ): Types.Moderation {
            {
                e
                with
                state = Types.STATE_CHALLENGED;
                challengeId = ?challengeId;
            }  
        };

        func _updateEntityWhenChallengeClosed(
            e: Types.Moderation, 
            result: ChallengeTypes.ChallengeResult
        ): Types.Moderation {
            {
                e
                with
                state = if(result == ChallengeResult.RESULT_ACCEPTED) Types.STATE_REVERTED else Types.STATE_CONFIRMED;
            }  
        };
    };

    func serialize(
        e: Types.Moderation,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("state", #nat32(e.state));
        res.put("reason", #nat32(e.reason));
        res.put("action", #nat32(e.action));
        res.put("body", #text(if ignoreCase Utils.toLower(e.body) else e.body));
        res.put("reportId", #nat32(e.reportId));
        res.put("entityType", #nat32(e.entityType));
        res.put("entityId", #nat32(e.entityId));
        res.put("entityPubId", #text(e.entityPubId));
        res.put("challengeId", switch(e.challengeId) {case null #nil; case (?challengeId) #nat32(challengeId);});
        res.put("entityOrg", #map(e.entityOrg));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Moderation {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            state = Variant.getOptNat32(map.get("state"));
            reason = Variant.getOptNat32(map.get("reason"));
            action = Variant.getOptNat32(map.get("action"));
            body = Variant.getOptText(map.get("body"));
            reportId = Variant.getOptNat32(map.get("reportId"));
            entityType = Variant.getOptNat32(map.get("entityType"));
            entityId = Variant.getOptNat32(map.get("entityId"));
            entityPubId = Variant.getOptText(map.get("entityPubId"));
            entityOrg = Variant.getOptMap(map.get("entityOrg"));
            challengeId = Variant.getOptNat32Opt(map.get("challengeId"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};