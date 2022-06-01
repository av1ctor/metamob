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
        let placesEmails = Table.Table<Types.PlaceEmail>(Schema.schema, serialize, deserialize);

        public func create(
            req: Types.PlaceEmailRequest
        ): Result.Result<Types.PlaceEmail, Text> {
            let e = _createEntity(req);
            switch(placesEmails.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            e: Types.PlaceEmail
        ): Result.Result<(), Text> {
            placesEmails.delete(e._id);
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.PlaceEmail, Text> {
            switch(placesEmails.get(_id)) {
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
        ): (Types.PlaceEmail, Types.PlaceEmail) -> Int {
            switch(column) {
                case "_id" func(a: Types.PlaceEmail, b: Types.PlaceEmail): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case _ {
                    func(a: Types.PlaceEmail, b: Types.PlaceEmail): Int = 0;
                };
            };
        };

        public func findByPlaceId(
            placeId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.PlaceEmail], Text> {

            let criterias = ?[
                {       
                    key = "placeId";
                    op = #eq;
                    value = #nat32(placeId);
                }
            ];
            
            return placesEmails.find(
                criterias, 
                FilterUtils.toSortBy<Types.PlaceEmail>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByPlaceIdAndEmail(
            placeId: Nat32,
            email: Text
        ): Result.Result<Types.PlaceEmail, Text> {
            switch(placesEmails.findOne([
                {       
                    key = "placeId";
                    op = #eq;
                    value = #nat32(placeId);
                },
                {       
                    key = "email";
                    op = #eq;
                    value = #text(Utils.toLower(email));
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
            return placesEmails.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            placesEmails.restore(entities);
        };

        func _createEntity(
            req: Types.PlaceEmailRequest
        ): Types.PlaceEmail {
            {
                _id = placesEmails.nextId();
                placeId = req.placeId;
                email = req.email;
            }
        };
    };

    func serialize(
        e: Types.PlaceEmail,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("placeId", #nat32(e.placeId));
        res.put("email", #text(if ignoreCase Utils.toLower(e.email) else e.email));

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.PlaceEmail {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            placeId = Variant.getOptNat32(map.get("placeId"));
            email = Variant.getOptText(map.get("email"));
        }
    };
};