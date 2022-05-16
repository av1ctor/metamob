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
        let reports = Table.Table<Types.Report>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("reports")));

        public func create(
            req: Types.ReportRequest,
            callerId: Nat32
        ): Result.Result<Types.Report, Text> {
            let e = _createEntity(req, callerId);
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

        public func assign(
            report: Types.Report, 
            toUserId: Nat32,
            callerId: Nat32
        ): Result.Result<Types.Report, Text> {
            let e = _updateEntityWhenAssigned(report, toUserId, callerId);
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
        ): ?[Table.SortBy<Types.Report>] {
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
        ): Result.Result<[Types.Report], Text> {
            return reports.find(_getCriterias(criterias), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Report], Text> {

            let criterias = ?[
                {       
                    key = "campaignId";
                    op = #eq;
                    value = #nat32(campaignId);
                }
            ];
            
            return reports.find(criterias, _getSortBy(sortBy), _getLimit(limit)/*, null*/);
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
            
            return reports.count(criterias);
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Report], Text> {

            let criterias = ?[
                {       
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(userId);
                }
            ];
            
            return reports.find(criterias, _getSortBy(sortBy), _getLimit(limit)/*, null*/);
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
            callerId: Nat32
        ): Types.Report {
            {
                _id = reports.nextId();
                pubId = ulid.next();
                state = Types.STATE_CREATED;
                result = Types.RESULT_NOTSOLVED;
                description = req.description;
                resolution = "";
                entityType = req.entityType;
                entityId = req.entityId;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
                assignedAt = null;
                assignedTo = null;
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
                description = req.description;
                resolution = e.resolution;
                entityType = e.entityType;
                entityId = e.entityId;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                assignedAt = e.assignedAt;
                assignedTo = e.assignedTo;
            }  
        };

        func _updateEntityWhenAssigned(
            e: Types.Report, 
            toUserId: Nat32,
            callerId: Nat32
        ): Types.Report {
            {
                _id = e._id;
                pubId = e.pubId;
                state = Types.STATE_ASSIGNED;
                result = e.result;
                description = e.description;
                resolution = e.resolution;
                entityType = e.entityType;
                entityId = e.entityId;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                assignedAt = ?Time.now();
                assignedTo = ?toUserId;
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
                state = Types.STATE_CLOSED;
                result = req.result;
                description = e.description;
                resolution = req.resolution;
                entityType = e.entityType;
                entityId = e.entityId;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
                assignedAt = e.assignedAt;
                assignedTo = e.assignedTo;
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
        res.put("description", #text(if ignoreCase Utils.toLower(e.description) else e.description));
        res.put("resolution", #text(if ignoreCase Utils.toLower(e.resolution) else e.resolution));
        res.put("entityType", #nat32(e.entityType));
        res.put("entityId", #nat32(e.entityId));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});
        res.put("assignedAt", switch(e.assignedAt) {case null #nil; case (?assignedAt) #int(assignedAt);});
        res.put("assignedTo", switch(e.assignedTo) {case null #nil; case (?assignedTo) #nat32(assignedTo);});

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
            description = Variant.getOptText(map.get("description"));
            resolution = Variant.getOptText(map.get("resolution"));
            entityType = Variant.getOptNat32(map.get("entityType"));
            entityId = Variant.getOptNat32(map.get("entityId"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
            assignedAt = Variant.getOptIntOpt(map.get("assignedAt"));
            assignedTo = Variant.getOptNat32Opt(map.get("assignedTo"));
        }
    };
};