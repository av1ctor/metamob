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
import Variant "mo:mo-table/variant";
import Table "mo:mo-table/table";
import Utils "../common/utils";
import FilterUtils "../common/filters";
import Types "./types";
import Schema "./schema";

module {
    public class Repository(
    ) {
        let placesUsers = Table.Table<Types.PlaceUser>(Schema.schema, serialize, deserialize);

        public func create(
            req: Types.PlaceUserRequest,
            callerId: Nat32
        ): Result.Result<Types.PlaceUser, Text> {
            let e = _createEntity(req, callerId);
            switch(placesUsers.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            placeUser: Types.PlaceUser, 
            req: Types.PlaceUserRequest
        ): Result.Result<Types.PlaceUser, Text> {
            let e = _updateEntity(placeUser, req);
            switch(placesUsers.replace(placeUser._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            e: Types.PlaceUser
        ): Result.Result<(), Text> {
            placesUsers.delete(e._id);
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.PlaceUser, Text> {
            switch(placesUsers.get(_id)) {
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
        ): (Types.PlaceUser, Types.PlaceUser) -> Int {
            switch(column) {
                case "_id" func(a: Types.PlaceUser, b: Types.PlaceUser): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case _ {
                    func(a: Types.PlaceUser, b: Types.PlaceUser): Int = 0;
                };
            };
        };

        public func findByPlaceId(
            placeId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.PlaceUser], Text> {

            let criterias = ?[
                {       
                    key = "placeId";
                    op = #eq;
                    value = #nat32(placeId);
                }
            ];
            
            return placesUsers.find(
                criterias, 
                FilterUtils.toSortBy<Types.PlaceUser>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByPlaceIdAndUserId(
            placeId: Nat32,
            userId: Nat32
        ): Result.Result<Types.PlaceUser, Text> {
            switch(placesUsers.findOne([
                {       
                    key = "placeId";
                    op = #eq;
                    value = #nat32(placeId);
                },
                {       
                    key = "userId";
                    op = #eq;
                    value = #nat32(userId);
                }
            ])) {
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

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return placesUsers.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            placesUsers.restore(entities);
        };

        func _createEntity(
            req: Types.PlaceUserRequest,
            callerId: Nat32
        ): Types.PlaceUser {
            {
                _id = placesUsers.nextId();
                placeId = req.placeId;
                userId = callerId;
                termsAccepted = req.termsAccepted;
            }
        };

        func _updateEntity(
            e: Types.PlaceUser, 
            req: Types.PlaceUserRequest
        ): Types.PlaceUser {
            {
                _id = e._id;
                placeId = e.placeId;
                userId = e.userId;
                termsAccepted = req.termsAccepted;
            }
        };
    };

    func serialize(
        e: Types.PlaceUser,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("placeId", #nat32(e.placeId));
        res.put("userId", #nat32(e.userId));
        res.put("termsAccepted", #bool(e.termsAccepted));

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.PlaceUser {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            placeId = Variant.getOptNat32(map.get("placeId"));
            userId = Variant.getOptNat32(map.get("userId"));
            termsAccepted = Variant.getOptBool(map.get("termsAccepted"));
        }
    };
};