import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
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

module {
    public class Repository(
    ) {
        let notifications = Table.Table<Types.Notification>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("notifications")));

        public func create(
            req: Types.NotificationRequest,
            callerId: Nat32
        ): Result.Result<Types.Notification, Text> {
            let e = _createEntity(req, callerId);
            switch(notifications.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func markAsRead(
            notification: Types.Notification
        ): Result.Result<Types.Notification, Text> {
            let e = _updateEntityWhenRead(notification);
            switch(notifications.replace(notification._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func delete(
            notification: Types.Notification
        ): Result.Result<(), Text> {
            switch(notifications.delete(notification._id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case _ {
                    #ok();
                }
            }
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Notification, Text> {
            switch(notifications.get(_id)) {
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
        ): Result.Result<Types.Notification, Text> {
            switch(notifications.findOne([{
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
        ): (Types.Notification, Types.Notification) -> Int {
            switch(column) {
                case "_id" func(a: Types.Notification, b: Types.Notification): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Notification, b: Types.Notification): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Notification, b: Types.Notification): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case _ {
                    func(a: Types.Notification, b: Types.Notification): Int = 0;
                };
            };
        };
        
        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Notification], Text> {
            return notifications.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Notification>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByUser(
            createdBy: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Notification], Text> {
            let criterias = ?[
                {
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(createdBy);
                }
            ];
            
            return notifications.find(
                criterias, 
                FilterUtils.toSortBy<Types.Notification>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func countUnreadByUser(
            createdBy: Nat32,
        ): Result.Result<Nat32, Text> {
            let criterias = ?[
                {
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(createdBy);
                },
                {
                    key = "readAt";
                    op = #eq;
                    value = #nil;
                }
            ];
            
            switch(notifications.find(criterias, null, null)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(entities)) {
                    #ok(Nat32.fromNat(entities.size()));
                };
            };
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return notifications.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            notifications.restore(entities);
        };

        func _createEntity(
            req: Types.NotificationRequest,
            callerId: Nat32
        ): Types.Notification {
            {
                _id = notifications.nextId();
                pubId = ulid.next();
                title = req.title;
                body = req.body;
                createdAt = Time.now();
                createdBy = callerId;
                readAt = null;
            }
        };

        func _updateEntityWhenRead(
            e: Types.Notification
        ): Types.Notification {
            {
                e
                with
                readAt = ?Time.now();
            }
        };
    };

    public func serialize(
        e: Types.Notification,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("title", #text(e.title));
        res.put("body", #text(e.body));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("readAt", switch(e.readAt) {case null #nil; case (?readAt) #int(readAt);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Notification {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            title = Variant.getOptText(map.get("title"));
            body = Variant.getOptText(map.get("body"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            readAt = Variant.getOptIntOpt(map.get("readAt"));
        }
    };
};