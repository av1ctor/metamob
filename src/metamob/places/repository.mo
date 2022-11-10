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
import FilterUtils "../common/filters";
import Types "./types";
import Schema "./schema";
import CampaignRepository "../campaigns/repository";
import ModerationTypes "../moderations/types";

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

        public func moderate(
            place: Types.Place, 
            req: Types.PlaceRequest,
            moderation: ModerationTypes.Moderation,
            callerId: Nat32
        ): Result.Result<Types.Place, Text> {
            let e = if(moderation.action == ModerationTypes.ACTION_REDACTED) {
                _updateEntityWhenModeratedAndRedacted(place, req, moderation.reason, callerId);
            }
            else {
                _updateEntityWhenModeratedAndFlagged(place, moderation.reason, callerId);
            };

            switch(places.replace(place._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func revertModeration(
            campaign: Types.Place,
            moderation: ModerationTypes.Moderation
        ): Result.Result<Types.Place, Text> {
            let e = deserialize(Variant.mapToHashMap(moderation.entityOrg));

            switch(places.replace(campaign._id, e)) {
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

        func _comparer(
            column: Text,
            dir: Int
        ): (Types.Place, Types.Place) -> Int {
            switch(column) {
                case "_id" func(a: Types.Place, b: Types.Place): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Place, b: Types.Place): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "name" func(a, b) = 
                    Utils.order2Int(Text.compare(a.name, b.name)) * dir;
                case "kind" func(a, b) = 
                    Utils.order2Int(Nat32.compare(a.kind, b.kind)) * dir;
                case "createdAt" func(a: Types.Place, b: Types.Place): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case _ {
                    func(a: Types.Place, b: Types.Place): Int = 0;
                };
            };
        };

        public func findByUser(
            userId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Place], Text> {

            let criterias = ?[
                {       
                    key = "createdBy";
                    op = #eq;
                    value = #nat32(userId);
                }
            ];
            
            return places.find(
                criterias, 
                FilterUtils.toSortBy<Types.Place>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Place], Text> {
            return places.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Place>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)                
            );
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
                kind = req.kind;
                auth = req.auth;
                name = req.name;
                description = req.description;
                icon = req.icon;
                banner = req.banner;
                terms = req.terms;
                active = req.active;
                lat = req.lat;
                lng = req.lng;
                moderated = ModerationTypes.REASON_NONE;
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
                e
                with
                kind = req.kind;
                auth = req.auth;
                name = req.name;
                description = req.description;
                icon = req.icon;
                banner = req.banner;
                terms = req.terms;
                active = req.active;
                lat = req.lat;
                lng = req.lng;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModeratedAndRedacted(
            e: Types.Place, 
            req: Types.PlaceRequest,
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Place {
            {
                e
                with
                name = req.name;
                description = req.description;
                icon = req.icon;
                banner = req.banner;
                terms = req.terms;
                active = req.active;
                lat = req.lat;
                lng = req.lng;
                moderated = e.moderated | reason;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModeratedAndFlagged(
            e: Types.Place, 
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Place {
            {
                e
                with
                moderated = e.moderated | reason;
            }  
        };
    };

    public func serialize(
        e: Types.Place,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);
        
        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("parentId", switch(e.parentId) {case null #nil; case (?parentId) #nat32(parentId);});
        res.put("kind", #nat32(e.kind));
        switch(e.auth) {
            case (#none_) {
                res.put("auth", #nat32(Types.RESTRICTION_NONE));
            };
            case (#email) {
                res.put("auth", #nat32(Types.RESTRICTION_EMAIL));
            };
            case (#dip20(dip)) {
                res.put("auth", #nat32(Types.RESTRICTION_DIP20));
                res.put("auth_canisterId", #text(dip.canisterId));
                res.put("auth_minValue", #nat(dip.minValue));
            };
            case (#dip721(dip)) {
                res.put("auth", #nat32(Types.RESTRICTION_DIP721));
                res.put("auth_canisterId", #text(dip.canisterId));
                res.put("auth_minValue", #nat(dip.minValue));
            };
        };
        res.put("name", #text(if ignoreCase Utils.toLower(e.name) else e.name));
        res.put("description", #text(if ignoreCase Utils.toLower(e.description) else e.description));
        res.put("icon", #text(e.icon));
        res.put("banner", switch(e.banner) {case null #nil; case (?banner) #text(banner);});
        res.put("terms", switch(e.terms) {case null #nil; case (?terms) #text(terms);});
        res.put("active", #bool(e.active));
        res.put("lat", #float(e.lat));
        res.put("lng", #float(e.lng));
        res.put("moderated", #nat32(e.moderated));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };

    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Place {
        let auth = Variant.getOptNat32(map.get("auth"));

        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            parentId = Variant.getOptNat32Opt(map.get("parentId"));
            kind = Variant.getOptNat32(map.get("kind"));
            auth = 
                if(auth == Types.RESTRICTION_NONE) {
                    #none_;
                }
                else if(auth == Types.RESTRICTION_EMAIL) {
                    #email;
                }
                else if(auth == Types.RESTRICTION_DIP20) {
                    #dip20({
                        canisterId = Variant.getOptText(map.get("auth_canisterId"));
                        minValue = Variant.getOptNat(map.get("auth_minValue"));
                    });
                }
                else /*if(auth == Types.RESTRICTION_DIP721)*/ {
                    #dip721({
                        canisterId = Variant.getOptText(map.get("auth_canisterId"));
                        minValue = Variant.getOptNat(map.get("auth_minValue"));
                    });
                };
            name = Variant.getOptText(map.get("name"));
            description = Variant.getOptText(map.get("description"));
            icon = Variant.getOptText(map.get("icon"));
            banner = Variant.getOptTextOpt(map.get("banner"));
            terms = Variant.getOptTextOpt(map.get("terms"));
            active = Variant.getOptBool(map.get("active"));
            lat = Variant.getOptFloat(map.get("lat"));
            lng = Variant.getOptFloat(map.get("lng"));
            moderated = Variant.getOptNat32(map.get("moderated"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };
};