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
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Variant "mo:mo-table/variant";
import Table "mo:mo-table/table";
import Random "../common/random";
import ULID "../common/ulid";
import Utils "../common/utils";
import Types "./types";
import Schema "./schema";

module {
    public class Repository() {
        let users = Table.Table<Types.Profile>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("users")));

        public func create(
            principal: Principal, 
            req: Types.ProfileRequest
        ): Result.Result<Types.Profile, Text> {
            let prof = _createEntity(principal, req);
            switch(users.insert(prof._id, prof)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(prof);
                };
            };
        };

        public func update(
            prof: Types.Profile, 
            req: Types.ProfileRequest,
            callerId: Nat32,
        ): Result.Result<Types.Profile, Text> {
            let res = _updateEntity(prof, req, callerId);
            switch(users.replace(prof._id, res)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(res);
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Profile, Text> {
            switch(users.get(_id)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(prof)) {
                    switch(prof) {
                        case null {
                            return #err("Not found");
                        };
                        case (?prof) {
                            return #ok(prof);
                        };
                    };
                };
            };
        };        

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Profile, Text> {
            switch(users.findOne([{
                key = "pubId";
                op = #eq;
                value = #text(Utils.toLower(pubId));
            }])) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(prof)) {
                    switch(prof) {
                        case null {
                            return #err("Not found");
                        };
                        case (?prof) {
                            return #ok(prof);
                        };
                    };
                };
            };
        };

        public func findByPrincipal(
            principal: Text
        ): Result.Result<Types.Profile, Text> {
            switch(users.findOne([{
                key = "principal";
                op = #eq;
                value = #text(Utils.toLower(principal));
            }])) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(prof)) {
                    switch(prof) {
                        case null {
                            return #err("Not found");
                        };
                        case (?prof) {
                            return #ok(prof);
                        };
                    };
                };
            };
        };        

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            return users.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            users.restore(entities);
        };

        func _createEntity(
            principal: Principal, 
            req: Types.ProfileRequest
        ): Types.Profile {
            let _id = users.nextId();
            {
                _id = _id;
                pubId = ulid.next();
                principal = Principal.toText(principal);
                name = req.name;
                email = req.email;
                avatar = req.avatar;
                roles = switch(req.roles) {
                    case null [#user];
                    case (?val) val;
                };
                active = switch(req.active) {
                    case null false;
                    case (?val) val;
                };
                banned = false;
                countryId = req.countryId;
                createdAt = Time.now();
                createdBy = _id;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntity(
            prof: Types.Profile, 
            req: Types.ProfileRequest,
            callerId: Nat32
        ): Types.Profile {
            {
                _id = prof._id;
                pubId = prof.pubId;
                principal = prof.principal;
                name = req.name;
                email = req.email;
                avatar = req.avatar;
                roles = switch(req.roles) {
                    case null prof.roles;
                    case (?val) val;
                };
                active = switch(req.active) {
                    case null prof.active;
                    case (?val) val;
                };
                banned = switch(req.banned) {
                    case null prof.banned;
                    case (?val) val;
                };
                countryId = req.countryId;
                createdAt = prof.createdAt;
                createdBy = prof.createdBy;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };
    };

    func serialize(
        entity: Types.Profile,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);

        res.put("_id", #nat32(entity._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(entity.pubId) else entity.pubId));
        res.put("principal", #text(if ignoreCase Utils.toLower(entity.principal) else entity.principal));
        res.put("name", #text(if ignoreCase Utils.toLower(entity.name) else entity.name));
        res.put("email", #text(if ignoreCase Utils.toLower(entity.email) else entity.email));
        res.put("avatar", switch(entity.avatar) {case null #nil; case (?avatar) #text(avatar);});
        res.put("roles", #array(Array.map(entity.roles, _roleToVariant)));
        res.put("active", #bool(entity.active));
        res.put("banned", #bool(entity.banned));
        res.put("countryId", #nat32(entity.countryId));
        res.put("createdAt", #int(entity.createdAt));
        res.put("createdBy", #nat32(entity.createdBy));
        res.put("updatedAt", switch(entity.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(entity.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };
    
    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Profile {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            principal = Variant.getOptText(map.get("principal"));
            name = Variant.getOptText(map.get("name"));
            email = Variant.getOptText(map.get("email"));
            avatar = Variant.getOptTextOpt(map.get("avatar"));
            roles = Array.map(Variant.getOptArray(map.get("roles")), _variantToRole);
            active = Variant.getOptBool(map.get("active"));
            banned = Variant.getOptBool(map.get("banned"));
            countryId = Variant.getOptNat32(map.get("countryId"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };

    func _roleToVariant(
        role: Types.Role
    ): Variant.Variant {
        switch(role) {
            case (#admin) {
                #text("admin");
            };
            case (#user) {
                #text("user");
            };
        };
    };

    func _variantToRole(
        val: Variant.Variant
    ): Types.Role {
        switch(val) {
            case (#text(text)) {
                switch(text) {
                    case "user" #user;
                    case "admin" #admin;
                    case _ #user;
                };
            };
            case _ {
                #user
            };
        };
    };
};
