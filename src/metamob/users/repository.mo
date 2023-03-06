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
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Variant "mo:mo-table/variant";
import Table "mo:mo-table/table";
import Random "../common/random";
import ULID "../common/ulid";
import Utils "../common/utils";
import FilterUtils "../common/filters";
import Types "./types";
import Schema "./schema";
import ModerationTypes "../moderations/types";

module {
    public class Repository() {
        let users = Table.Table<Types.Profile>(Schema.schema, serialize, deserialize);
        let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("users")));
        let verifyId = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("verify")));

        public func create(
            principal: Principal, 
            req: Types.ProfileRequest
        ): Result.Result<Types.Profile, Text> {
            let e = _createEntity(principal, req, verifyId.next());
            switch(users.insert(e._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func update(
            prof: Types.Profile, 
            req: Types.ProfileRequest,
            callerId: Nat32,
        ): Result.Result<Types.Profile, Text> {
            let e = _updateEntity(prof, req, callerId);
            switch(users.replace(prof._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func verify(
            prof: Types.Profile
        ): Result.Result<Types.Profile, Text> {
            let e = _updateEntityWhenVerified(prof);
            switch(users.replace(prof._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func moderate(
            prof: Types.Profile, 
            req: Types.ProfileRequest,
            moderation: ModerationTypes.Moderation,
            callerId: Nat32
        ): Result.Result<Types.Profile, Text> {
            let e = if(moderation.action == ModerationTypes.ACTION_REDACTED) {
                _updateEntityWhenModeratedAndRedacted(prof, req, moderation.reason, callerId);
            }
            else {
                _updateEntityWhenModeratedAndFlagged(prof, moderation.reason, callerId);
            };

            switch(users.replace(prof._id, e)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                    return #ok(e);
                };
            };
        };

        public func revertModeration(
            campaign: Types.Profile,
            moderation: ModerationTypes.Moderation
        ): Result.Result<Types.Profile, Text> {
            let e = deserialize(Variant.mapToHashMap(moderation.entityOrg));

            switch(users.replace(campaign._id, e)) {
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

        func _comparer(
            column: Text,
            dir: Int
        ): (Types.Profile, Types.Profile) -> Int {
            switch(column) {
                case "_id" func(a: Types.Profile, b: Types.Profile): Int  = 
                    Utils.order2Int(Nat32.compare(a._id, b._id)) * dir;
                case "pubId" func(a: Types.Profile, b: Types.Profile): Int = 
                    Utils.order2Int(Text.compare(a.pubId, b.pubId)) * dir;
                case "createdAt" func(a: Types.Profile, b: Types.Profile): Int = 
                    Utils.order2Int(Int.compare(a.createdAt, b.createdAt)) * dir;
                case _ {
                    func(a: Types.Profile, b: Types.Profile): Int = 0;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Profile], Text> {
            return users.find(
                FilterUtils.toCriterias(criterias), 
                FilterUtils.toSortBy<Types.Profile>(sortBy, _comparer), 
                FilterUtils.toLimit(limit)
            );
        };

        public func findByRole(
            role: Types.Role
        ): Result.Result<[Types.Profile], Text> {
            let criterias = ?[
                {       
                    key = "roles";
                    op = #eq;
                    value = #nat32(_roleToNumber(role));
                }
            ];
            
            return users.find(
                criterias, 
                null, 
                null
            );
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
            req: Types.ProfileRequest,
            verifySecret: Text
        ): Types.Profile {
            let _id = users.nextId();
            {
                _id = _id;
                pubId = ulid.next();
                principal = Principal.toText(principal);
                verifySecret = verifySecret;
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
                banned = Types.BANNED_NONE;
                country = req.country;
                moderated = ModerationTypes.REASON_NONE;
                createdAt = Time.now();
                createdBy = _id;
                updatedAt = null;
                updatedBy = null;
            }
        };

        func _updateEntityWhenVerified(
            e: Types.Profile, 
        ): Types.Profile {
            {
                e
                with
                active = true;
                verifySecret = "";
            }  
        };

        func _updateEntity(
            e: Types.Profile, 
            req: Types.ProfileRequest,
            callerId: Nat32
        ): Types.Profile {
            {
                e
                with
                name = req.name;
                email = req.email;
                avatar = req.avatar;
                roles = switch(req.roles) {
                    case null e.roles;
                    case (?val) val;
                };
                active = switch(req.active) {
                    case null e.active;
                    case (?val) val;
                };
                banned = switch(req.banned) {
                    case null e.banned;
                    case (?val) val;
                };
                country = req.country;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModeratedAndRedacted(
            e: Types.Profile, 
            req: Types.ProfileRequest,
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Profile {
            {
                e
                with
                name = req.name;
                email = req.email;
                avatar = req.avatar;
                roles = switch(req.roles) {
                    case null e.roles;
                    case (?val) val;
                };
                active = switch(req.active) {
                    case null e.active;
                    case (?val) val;
                };
                banned = switch(req.banned) {
                    case null e.banned;
                    case (?val) val;
                };
                country = req.country;
                moderated = e.moderated | reason;
                updatedAt = ?Time.now();
                updatedBy = ?callerId;
            }  
        };

        func _updateEntityWhenModeratedAndFlagged(
            e: Types.Profile, 
            reason: ModerationTypes.ModerationReason,
            callerId: Nat32
        ): Types.Profile {
            {
                e
                with
                moderated = e.moderated | reason;
            }  
        };
    };

    public func serialize(
        e: Types.Profile,
        ignoreCase: Bool
    ): HashMap.HashMap<Text, Variant.Variant> {
        let res = HashMap.HashMap<Text, Variant.Variant>(Schema.schema.columns.size(), Text.equal, Text.hash);

        res.put("_id", #nat32(e._id));
        res.put("pubId", #text(if ignoreCase Utils.toLower(e.pubId) else e.pubId));
        res.put("principal", #text(if ignoreCase Utils.toLower(e.principal) else e.principal));
        res.put("verifySecret", #text(e.verifySecret));
        res.put("name", #text(if ignoreCase Utils.toLower(e.name) else e.name));
        res.put("email", #text(if ignoreCase Utils.toLower(e.email) else e.email));
        res.put("avatar", switch(e.avatar) {case null #nil; case (?avatar) #text(avatar);});
        res.put("roles", #array(Array.map(e.roles, _roleToVariant)));
        res.put("active", #bool(e.active));
        res.put("banned", #nat32(e.banned));
        res.put("country", #text(e.country));
        res.put("moderated", #nat32(e.moderated));
        res.put("createdAt", #int(e.createdAt));
        res.put("createdBy", #nat32(e.createdBy));
        res.put("updatedAt", switch(e.updatedAt) {case null #nil; case (?updatedAt) #int(updatedAt);});
        res.put("updatedBy", switch(e.updatedBy) {case null #nil; case (?updatedBy) #nat32(updatedBy);});

        res;
    };
    
    func deserialize(
        map: HashMap.HashMap<Text, Variant.Variant>
    ): Types.Profile {
        {
            _id = Variant.getOptNat32(map.get("_id"));
            pubId = Variant.getOptText(map.get("pubId"));
            principal = Variant.getOptText(map.get("principal"));
            verifySecret = Variant.getOptText(map.get("verifySecret"));
            name = Variant.getOptText(map.get("name"));
            email = Variant.getOptText(map.get("email"));
            avatar = Variant.getOptTextOpt(map.get("avatar"));
            roles = Array.map(Variant.getOptArray(map.get("roles")), _variantToRole);
            active = Variant.getOptBool(map.get("active"));
            banned = Variant.getOptNat32(map.get("banned"));
            country = Variant.getOptText(map.get("country"));
            moderated = Variant.getOptNat32(map.get("moderated"));
            createdAt = Variant.getOptInt(map.get("createdAt"));
            createdBy = Variant.getOptNat32(map.get("createdBy"));
            updatedAt = Variant.getOptIntOpt(map.get("updatedAt"));
            updatedBy = Variant.getOptNat32Opt(map.get("updatedBy"));
        }
    };

    func _roleToNumber(
        role: Types.Role
    ): Nat32 {
        switch(role) {
            case (#admin) {
                0;
            };
            case (#moderator) {
                1;
            };
            case (#user) {
                2;
            };
        };
    };

    func _roleToVariant(
        role: Types.Role
    ): Variant.Variant {
        #nat32(_roleToNumber(role));
    };

    func _variantToRole(
        val: Variant.Variant
    ): Types.Role {
        switch(val) {
            case (#nat32(value)) {
                switch(value) {
                    case 0 #admin;
                    case 1 #moderator;
                    case _ #user;
                };
            };
            case _ {
                #user
            };
        };
    };
};
