import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
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
    ) {
        let places = Table.Table<Types.Place>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("places")));

        public func create(
            req: Types.PlaceRequest,
            callerId: Nat32
        ): Result.Result<Types.Place, Text> {
            let e = _createEntity(req, callerId);
            switch(places.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            place: Types.Place, 
            req: Types.PlaceRequest,
            callerId: Nat32
        ): Result.Result<Types.Place, Text> {
            let e = _updateEntity(place, req, callerId);
            switch(places.replace(place._id, e)) {
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
        ): Result.Result<Types.Place, Text> {
            switch(places.get(_id)) {
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
        ): Result.Result<Types.Place, Text> {
            switch(places.findOne([{
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

        public func findTreeById(
            _id: Nat32
        ): Result.Result<[Types.Place], Text> {
            let res = Buffer.Buffer<Types.Place>(5);
            var id = ?_id;
            label l while(true) {
                switch(id) {
                    case null {
                        break l;
                    };
                    case (?_id) {
                        switch(places.get(_id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(e)) {
                                switch(e) {
                                    case null {
                                        break l
                                    };
                                    case (?e) {
                                        res.add(e);
                                        id := e.parentId;
                                    };
                                };
                            };
                        };
                    };
                };
            };

            #ok(res.toArray());
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
                                value = switch(crit.2) {
                                    case (#text(text)) {
                                        #text(Utils.toLower(text));
                                    };
                                    case _ {
                                        crit.2;
                                    };
                                };
                            }
                        }
                    )
                };
            };
        };

        func _getComparer(
            column: Text,
            dir: Int
        ): (Types.Place, Types.Place) -> Int {
            switch(column) {
                case "_id" func(a: Types.Place, b: Types.Place): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Place, b: Types.Place): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Place, b: Types.Place): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case _ {
                    func(a: Types.Place, b: Types.Place): Int = 0;
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
        ): ?[Table.SortBy<Types.Place>] {
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

        public func findByUser(
            userId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Place], Text> {

            let criterias = ?[
                {       
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(userId);
                }
            ];
            
            return places.find(criterias, _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Place], Text> {
            return places.find(_getCriterias(criterias), _getSortBy(sortBy), _getLimit(limit)/*, null*/);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return places.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            places.restore(entities);
        };

        func _createEntity(
            req: Types.PlaceRequest,
            callerId: Nat32
        ): Types.Place {
            {
                _id = places.nextId();
                pubId = ulid.next();
                parentId = req.parentId;
                private_ = req.private_;
                kind = req.kind;
                name = req.name;
                description = req.description;
                icon = req.icon;
                active = true;
                createdAt = Time.now();
                createdBy = callerId;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            e: Types.Place, 
            req: Types.PlaceRequest,
            callerId: Nat32
        ): Types.Place {
            {
                _id = e._id;
                pubId = e.pubId;
                parentId = e.parentId;
                private_ = req.private_;
                kind = req.kind;
                name = req.name;
                description = req.description;
                icon = req.icon;
                active = e.active;
                createdAt = e.createdAt;
                createdBy = e.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };
    };

    func serialize(
        e: Types.Place,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("parentId", switch(e.parentId) {case null #nil; case (?parentId) #nat32(parentId);});
        res.put("kind", #nat32(e.kind));
        res.put("private_", #bool(e.private_));
        res.put("name", #text(if ignoreCase Utils.toLower(e.name) else e.name));
        res.put("description", #text(if ignoreCase Utils.toLower(e.description) else e.description));
        res.put("icon", #text(e.icon));
        res.put("active", #bool(e.active));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Place {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            parentId = Variant.getOptNat32Opt(map.get("parentId"));
            kind = Variant.getOptNat32(map.get("kind"));
            private_ = Variant.getOptBool(map.get("private_"));
            name = Variant.getOptText(map.get("name"));
            description = Variant.getOptText(map.get("description"));
            icon = Variant.getOptText(map.get("icon"));
            active = Variant.getOptBool(map.get("active"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};