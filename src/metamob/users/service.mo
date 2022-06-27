import AccountTypes "../accounts/types";
import Array "mo:base/Array";
import D "mo:base/Debug";
import DaoService "../dao/service";
import LedgerUtils "../common/ledger";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Repository "./repository";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Types "./types";
import Utils "./utils";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        daoService: DaoService.Service,
        ledgerUtils: LedgerUtils.LedgerUtils
    ) {
        let repo = Repository.Repository();
        var hasAdmin: Bool = false;

        public func create(
            req: Types.ProfileRequest,
            invoker: Principal,
            owner: Principal
        ): Result.Result<Types.Profile, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };
            
            if(Option.isSome(req.roles) or 
                Option.isSome(req.active) or
                Option.isSome(req.banned)) {
                if(invoker != owner) {
                    if(hasAdmin) {
                        return #err("Forbidden: invalid fields");
                    };
                    hasAdmin := true;
                };
            };

            repo.create(invoker, req);
        };

        public func updateMe(
            req: Types.ProfileRequest,
            invoker: Principal
        ): Result.Result<Types.Profile, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };

            switch(repo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned) {
                        return #err("Forbidden: not active");
                    };
                    
                    if(Option.isSome(req.roles) or 
                        Option.isSome(req.active) or
                        Option.isSome(req.banned)) {
                        if(not Utils.isAdmin(caller)) {
                            return #err("Forbidden: invalid fields");
                        };
                    };
                    
                    repo.update(caller, req, caller._id);
                };
            };
        };

        public func update(
            id: Text, 
            req: Types.ProfileRequest,
            invoker: Principal
        ): Result.Result<Types.Profile, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };

            switch(repo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned) {
                        return #err("Forbidden: not active");
                    };
                    
                    if(Text.equal(caller.pubId, id)) {
                        if(Option.isSome(req.roles) or 
                            Option.isSome(req.active) or
                            Option.isSome(req.banned)) {
                            return #err("Forbidden: invalid fields");
                        };

                        repo.update(caller, req, caller._id);
                    }
                    else if(Utils.isAdmin(caller)) {
                        switch(repo.findByPubId(id)) {
                            case (#err(msg)) {
                                #err(msg);
                            };
                            case (#ok(prof)) {
                                repo.update(prof, req, caller._id);
                            };
                        };
                    }
                    else {
                        #err("Forbidden");
                    };
                };
            };
        };

        public func signupAsModerator(
            invoker: Principal
        ): async Result.Result<Types.Profile, Text> {
            switch(repo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned) {
                        return #err("Forbidden: not active");
                    };
                    
                    if(Utils.isModerator(caller)) {
                        return #err("Your are already a moderator");
                    };

                    let mmtStaked = await _getMmtStaked(caller);
                    let minStaked = Nat64.toNat(daoService.config.getAsNat64("MODERATOR_MIN_STAKE"));
                    if(mmtStaked < minStaked) {
                        return #err("Your staked MMT's are not enough to become a moderator");
                    };
                    
                    repo.update(
                        caller, 
                        {
                            active = ?caller.active;
                            avatar = caller.avatar;
                            banned = ?caller.banned;
                            country = caller.country;
                            email = caller.email;
                            name = caller.name;
                            roles = ?_addRole(caller.roles, #moderator);
                        }, 
                        caller._id
                    );
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Profile, Text> {
            repo.findById(_id);
        };

        public func findByIdEx(
            _id: Nat32,
            invoker: Principal
        ): Result.Result<Types.Profile, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };

            let caller = repo.findByPrincipal(Principal.toText(invoker));
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned) {
                        return #err("Forbidden: not active");
                    };

                    if(caller._id != _id) {
                        if(not Utils.isModerator(caller)) {
                            return #err("Forbidden");
                        };
                    };
            
                    repo.findById(_id);
                };
            };
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Profile, Text> {
            repo.findByPubId(pubId);
        };

        public func findByPrincipal(
            principal: Principal
        ): Result.Result<Types.Profile, Text> {
            repo.findByPrincipal(Principal.toText(principal));
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Profile], Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };

            let caller = repo.findByPrincipal(Principal.toText(invoker));
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned) {
                        return #err("Forbidden: not active");
                    };

                    if(not Utils.isModerator(caller)) {
                        return #err("Forbidden");
                    };

                    repo.find(criterias, sortBy, limit);
                };
            };
        };

        public func getAccountId(
            invoker: Principal,
            this: actor {}
        ): AccountTypes.AccountIdentifier {
            ledgerUtils.getAccountId(invoker, this);
        };

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            repo.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            repo.restore(entities);
        };

        private func _getMmtStaked(
            caller: Types.Profile
        ): async Nat {
            await daoService.stakedBalanceOf(caller);
        };

        private func _addRole(
            roles: [Types.Role],
            role: Types.Role
        ): [Types.Role] {
            Array.append(roles, [role]);
        };
        
        private func _removeRole(
            roles: [Types.Role],
            role: Types.Role
        ): [Types.Role] {
            Array.filter(roles, func (r: Types.Role): Bool = r == role)
        };

        public func verify(
            this: actor {}
        ): async () {
            let minStaked = Nat64.toNat(daoService.config.getAsNat64("MODERATOR_MIN_STAKE"));
            
            switch(repo.findByRole(#moderator)) {
                case (#ok(moderators)) {
                    if(moderators.size() > 0) {
                        for(e in moderators.vals()) {
                            let staked = await daoService.stakedBalanceOf(e);
                            if(staked < minStaked) {
                                D.print("Info: UserService.verify: removing moderator: " # Nat32.toText(e._id));
                                ignore repo.update(
                                    e,
                                    {
                                        active = ?e.active;
                                        avatar = e.avatar;
                                        banned = ?e.banned;
                                        country = e.country;
                                        email = e.email;
                                        name = e.name;
                                        roles = ?_removeRole(e.roles, #moderator)
                                    },
                                    1
                                );
                            };
                        };
                    };
                };
                case (#err(msg)) {
                    D.print("Error: UserService.verify: " # msg);
                };
            };
        };

        public func getRepository(
        ): Repository.Repository {
            repo;
        };
    };
};
