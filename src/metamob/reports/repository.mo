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

module {
    public class Repository(
    ) {
        let reports = Table.Table<Types.Report>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("reports")));

        public func create(
            req: Types.ReportRequest,
            entityCreatedBy: Nat32,
            callerId: Nat32,
            assignedToId: Nat32, 
            dueAt: Int
        ): Result.Result<Types.Report, Text> {
            let e = _createEntity(req, entityCreatedBy, callerId, assignedToId, dueAt);
            switch(reports.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            report: Types.Report, 
            req: Types.ReportRequest,
            callerId: Nat32
        ): Result.Result<Types.Report, Text> {
            let e = _updateEntity(report, req, callerId);
            switch(reports.replace(report._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func updateModerator(
            report: Types.Report, 
            moderatorId: Nat32,
            dueAt: Int
        ): Result.Result<Types.Report, Text> {
            let e = _updateEntityWhenModeratorChanged(report, moderatorId, dueAt);
            switch(reports.replace(report._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func close(
            report: Types.Report, 
            req: Types.ReportCloseRequest,
            callerId: Nat32
        ): Result.Result<Types.Report, Text> {
            let e = _updateEntityWhenClosed(report, req, callerId);
            switch(reports.replace(report._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func moderate(
            report: Types.Report, 
            moderationId: Nat32,
            callerId: Nat32
        ): Result.Result<Types.Report, Text> {
            let e = _updateEntityWhenModerating(report, moderationId, callerId);
            switch(reports.replace(report._id, e)) {
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
        ): Result.Result<Types.Report, Text> {
            switch(reports.get(_id)) {
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
        ): Result.Result<Types.Report, Text> {
            switch(reports.findOne([{
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

        public func findDue(
            size: Nat
        ): Result.Result<[Types.Report], Text> {

            let criterias = ?[
                {
                    key = "state";
                    op = #eq;
                    value = #nat32(Types.STATE_ASSIGNED);
                },
                {       
                    key = "dueAt";
                    op = #lte;
                    value = #int(Time.now());
                }                    
            ];
            
            return reports.find(
                criterias, 
                null, 
                ?{offset = 0; size = size;}
            );
        };

        func _comparer(
            column: Text,
            dir: Int
        ): (Types.Report, Types.Report) -> Int {
            switch(column) {
                case "_id" func(a: Types.Report, b: Types.Report): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Report, b: Types.Report): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Report, b: Types.Report): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case "entityId" func(a: Types.Report, b: Types.Report): Int = 
                    Utils.order2Int(Nat32.compare(a.entityId, b.entityId)) * dir;
                case _ {
                    func(a: Types.Report, b: Types.Report): Int = 0;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Report], Text> {
            return reports.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Report>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Report], Text> {

            let criterias = ?[
                {       
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(userId);
                }
            ];
            
            return reports.find(
                criterias, 
                FilterUtils.toSortBy<Types.Report>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByReportedUser(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Report], Text> {

            let criterias = ?[
                {       
                    key = "entityCreatedBy";
                    op = #eq;
                    value = #nat32(userId);
                }
            ];
            
            return reports.find(
                criterias, 
                FilterUtils.toSortBy<Types.Report>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findAssignedByEntityAndModerator(
            entityId: Nat32,
            assignedToId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Report], Text> {

            let criterias = ?[
                {       
                    key = "entityId";
                    op = #eq;
                    value = #nat32(entityId);
                },
                {       
                    key = "assignedTo";
                    op = #eq;
                    value = #nat32(assignedToId);
                },
                {       
                    key = "state";
                    op = #eq;
                    value = #nat32(Types.STATE_ASSIGNED);
                },
            ];
            
            return reports.find(
                criterias, 
                FilterUtils.toSortBy<Types.Report>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return reports.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            reports.restore(entities);
        };

        func _createEntity(
            req: Types.ReportRequest,
            entityCreatedBy: Nat32,
            callerId: Nat32,
            assignedToId: Nat32,
            dueAt: Int
        ): Types.Report {
            {
                _id = reports.nextId();
                pubId = ulid.next();
                state = Types.STATE_ASSIGNED;
                result = Types.RESULT_VERIFYING;
                kind = req.kind;
                description = req.description;
                resolution = "";
                entityType = req.entityType;
                entityId = req.entityId;
                entityPubId = req.entityPubId;
                entityCreatedBy = entityCreatedBy;
                moderationId = null;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
                assignedAt = Time.now();
                assignedTo = assignedToId;
                dueAt = dueAt;
            }
        };

        func _updateEntity(
            e: Types.Report, 
            req: Types.ReportRequest,
            callerId: Nat32
        ): Types.Report {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                result = e.result;
                kind = req.kind;
                description = req.description;
                resolution = e.resolution;
                entityType = e.entityType;
                entityId = e.entityId;
                entityPubId = e.entityPubId;
                entityCreatedBy = e.entityCreatedBy;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                moderationId = e.moderationId;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                assignedAt = e.assignedAt;
                assignedTo = e.assignedTo;
                dueAt = e.dueAt;
            }  
        };

        func _updateEntityWhenClosed(
            e: Types.Report, 
            req: Types.ReportCloseRequest,
            callerId: Nat32
        ): Types.Report {
            {
                _id = e._id;
                pubId = e.pubId;
                state = if(req.result == Types.RESULT_VERIFYING) 
                        Types.STATE_ASSIGNED 
                    else 
                        Types.STATE_CLOSED;
                result = req.result;
                kind = e.kind;
                description = e.description;
                resolution = req.resolution;
                entityType = e.entityType;
                entityId = e.entityId;
                entityPubId = e.entityPubId;
                entityCreatedBy = e.entityCreatedBy;
                moderationId = e.moderationId;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                assignedAt = e.assignedAt;
                assignedTo = e.assignedTo;
                dueAt = e.dueAt;
            }  
        };

        func _updateEntityWhenModerating(
            e: Types.Report, 
            moderationId: Nat32,
            callerId: Nat32
        ): Types.Report {
            {
                _id = e._id;
                pubId = e.pubId;
                state = Types.STATE_MODERATING;
                result = e.result;
                kind = e.kind;
                description = e.description;
                resolution = e.resolution;
                entityType = e.entityType;
                entityId = e.entityId;
                entityPubId = e.entityPubId;
                entityCreatedBy = e.entityCreatedBy;
                moderationId = ?moderationId;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                assignedAt = e.assignedAt;
                assignedTo = e.assignedTo;
                dueAt = e.dueAt;
            }  
        };

        func _updateEntityWhenModeratorChanged(
            e: Types.Report, 
            moderatorId: Nat32,
            dueAt: Int
        ): Types.Report {
            {
                _id = e._id;
                pubId = e.pubId;
                state = Types.STATE_MODERATING;
                result = e.result;
                kind = e.kind;
                description = e.description;
                resolution = e.resolution;
                entityType = e.entityType;
                entityId = e.entityId;
                entityPubId = e.entityPubId;
                entityCreatedBy = e.entityCreatedBy;
                moderationId = e.moderationId;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                assignedAt = Time.now();
                assignedTo = moderatorId;
                dueAt = dueAt;
            }  
        };
    };

    func serialize(
        e: Types.Report,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("state", #nat32(e.state));
        res.put("result", #nat32(e.result));
        res.put("kind", #nat32(e.kind));
        res.put("description", #text(if ignoreCase Utils.toLower(e.description) else e.description));
        res.put("resolution", #text(if ignoreCase Utils.toLower(e.resolution) else e.resolution));
        res.put("entityType", #nat32(e.entityType));
        res.put("entityId", #nat32(e.entityId));
        res.put("entityPubId", #text(e.entityPubId));
        res.put("entityCreatedBy", #nat32(e.entityCreatedBy));
        res.put("moderationId", switch(e.moderationId) {case null #nil; case (?moderationId) #nat32(moderationId);});
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});
        res.put("assignedAt", #int(e.assignedAt));
        res.put("assignedTo", #nat32(e.assignedTo));
        res.put("dueAt", #int(e.dueAt));

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Report {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            state = Variant.getOptNat32(map.get("state"));
            result = Variant.getOptNat32(map.get("result"));
            kind = Variant.getOptNat32(map.get("kind"));
            description = Variant.getOptText(map.get("description"));
            resolution = Variant.getOptText(map.get("resolution"));
            entityType = Variant.getOptNat32(map.get("entityType"));
            entityId = Variant.getOptNat32(map.get("entityId"));
            entityPubId = Variant.getOptText(map.get("entityPubId"));
            entityCreatedBy = Variant.getOptNat32(map.get("entityCreatedBy"));
            moderationId = Variant.getOptNat32Opt(map.get("moderationId"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
            assignedAt = Variant.getOptInt(map.get("assignedAt"));
            assignedTo = Variant.getOptNat32(map.get("assignedTo"));
            dueAt = Variant.getOptInt(map.get("dueAt"));
        }
    };
};