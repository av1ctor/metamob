import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Option "mo:base/Option";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import Utils "./utils";
import AccountTypes "../accounts/types";
import LedgerUtils "../utils/ledger";

module {
    public class Service(
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

            let caller = repo.findByPrincipal(Principal.toText(invoker));
            switch(caller) {
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

            let caller = repo.findByPrincipal(Principal.toText(invoker));
            switch(caller) {
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
            LedgerUtils.getAccountId(invoker, this);
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

        public func getRepository(
        ): Repository.Repository {
            repo;
        };
    };
};
