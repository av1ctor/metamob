import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Option "mo:base/Option";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import Utils "./utils";
import D "mo:base/Debug";

module {
    public class Service(
    ) {
        let repo = Repository.Repository();
        
        public func create(
            req: Types.ProfileRequest,
            invoker: Principal,
            owner: Principal
        ): Result.Result<Types.ProfileResponse, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };
            
            if(Option.isSome(req.roles) or 
                Option.isSome(req.active) or
                Option.isSome(req.banned)) {
                if(not Principal.equal(invoker, owner)) {
                    D.print(debug_show((invoker, owner)));
                    //return #err("Forbidden: invalid fields");
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

        public func backup(
        ): [[(Text, Variant.Variant)]] {
            repo.backup();
        };

        public func restore(
            entities: [[(Text, Variant.Variant)]]
        ) {
            repo.restore(entities);
        };
    };
};
