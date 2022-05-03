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
import Debug "mo:base/Debug";

module {
    public class Repository() {
        let categories = Table.Table<Types.Category>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("categories")));

        public func create(
            req: Types.CategoryRequest,
            callerId: Nat32
        ): Result.Result<Types.Category, Text> {
            let category = _createEntity(req, callerId);
            switch(categories.insert(category._id, category)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(category);
                };
            };
        };

        public func update(
            category: Types.Category, 
            req: Types.CategoryRequest,
            callerId: Nat32
        ): Result.Result<Types.Category, Text> {
            let res = _updateEntity(category, req, callerId);
            switch(categories.replace(category._id, res)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(res);
                };
            };
        };

        public func delete(
            category: Types.Category
        ): Result.Result<(), Text> {
            //FIXME: delete category's topics
            return categories.delete(category._id);
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Category, Text> {
            switch(categories.get(_id)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(entity)) {
                    switch(entity) {
                        case null {
                            return #err("Not found");
                        };
                        case (?entity) {
                            return #ok(entity);
                        };
                    };
                };
            };
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Category, Text> {
            switch(categories.findOne([{
                key = "pubId";
                op = #eq;
                value = #text(Utils.toLower(pubId));
            }])) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(entity)) {
                    switch(entity) {
                        case null {
                            return #err("Not found");
                        };
                        case (?entity) {
                            return #ok(entity);
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
        ): (Types.Category, Types.Category) -> Int {
            switch(column) {
                case "_id" func(a: Types.Category, b: Types.Category): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Category, b: Types.Category): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "name" func(a: Types.Category, b: Types.Category): Int = 
                    Utils.order2Int(Text.compare(a.name, b.name)) * dir;
                case "createdAt" func(a: Types.Category, b: Types.Category): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case _ {
                    func(a: Types.Category, b: Types.Category): Int = 0;
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
        ): ?[Table.SortBy<Types.Category>] {
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
        ): Result.Result<[Types.Category], Text> {
            return categories.find(_getCriterias(criterias), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Category], Text> {

            func buildCriterias(userId: Nat32): ?[Table.Criteria] {
                ?[
                    {       
                        key = "createdBy";
                        op = #eq;
                        value = #nat32(userId);
                    }
                ]
            };
            
            return categories.find(buildCriterias(userId), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return categories.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            categories.restore(entities);
        };

        func _createEntity(
            req: Types.CategoryRequest,
            callerId: Nat32
        ): Types.Category {
            {
                _id = categories.nextId();
                pubId = ulid.next();
                name = req.name;
                description = req.description;
                active = true;
                color = req.color;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            category: Types.Category, 
            req: Types.CategoryRequest,
            callerId: Nat32
        ): Types.Category {
            {
                _id = category._id;
                pubId = category.pubId;
                name = req.name;
                description = req.description;
                active = category.active;
                color = req.color;
                createdAt = category.createdAt;
                createdBy = category.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };
    };

    func serialize(
        entity: Types.Category,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(entity._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(entity.pubId) else entity.pubId));
        res.put("name", #text(if ignoreCase Utils.toLower(entity.name) else entity.name));
        res.put("description", #text(entity.description));
        res.put("active", #bool(entity.active));
        res.put("color", #text(entity.color));
        res.put("createdAt", #int(entity.createdAt));
        res.put("createdBy", #nat32(entity.createdBy));
        res.put("updatedAt", switch(entity.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(entity.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Category {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            name = Variant.getOptText(map.get("name"));
            description = Variant.getOptText(map.get("description"));
            active = Variant.getOptBool(map.get("active"));
            color = Variant.getOptText(map.get("color"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};