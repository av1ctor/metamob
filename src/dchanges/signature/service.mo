import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import UserTypes "../user/types";
import UserUtils "../user/utils";
import UserService "../user/service";
import PetitionService "../petition/service";

module {
    public class Service(
        userService: UserService.Service,
        petitionService: PetitionService.Service
    ) {
        let repo = Repository.Repository(petitionService.getRepository());

        public func create(
            req: Types.SignatureRequest,
            invoker: Principal
        ): Result.Result<Types.Signature, Text> {
            let caller = userService.findByPubId(Principal.toText(invoker));
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        repo.create(req, caller._id);
                    };
                };
            };
        };

        public func update(
            id: Text, 
            req: Types.SignatureRequest,
            invoker: Principal
        ): Result.Result<Types.Signature, Text> {
            let caller = userService.findByPubId(Principal.toText(invoker));
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    }
                    else {
                        switch(repo.findByPubId(id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(response)) {
                                if(not canChange(caller, response)) {
                                    return #err("Forbidden");
                                };
                                
                                return repo.update(response, req, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func findById(
            id: Text
        ): Result.Result<Types.Signature, Text> {
            repo.findByPubId(id);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByPetition(
            petitionId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {
            repo.findByPetition(petitionId, sortBy, limit);
        };

        public func countByPetition(
            petitionId: Nat32
        ): Result.Result<Nat, Text> {
            repo.countByPetition(petitionId);
        };

        public func findByUser(
            userId: /* Text */ Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {
            repo.findByUser(userId, sortBy, limit);
        };

        public func delete(
            id: Text,
            invoker: Principal
        ): Result.Result<(), Text> {
            let caller = userService.findByPubId(Principal.toText(invoker));
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    }
                    else {
                        switch(repo.findByPubId(id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(response)) {
                                if(not canChange(caller, response)) {
                                    return #err("Forbidden");
                                };
                                
                                return repo.delete(response, caller._id);
                            };
                        };
                    };
                };
            };
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

        func hasAuth(
            caller: UserTypes.Profile
        ): Bool {
            if(UserUtils.isAdmin(caller)) {
                return true;
            };
            
            if(not caller.active) {
                return false;
            };

            if(caller.banned) {
                return false;
            };

            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            response: Types.Signature
        ): Bool {
            if(caller._id != response.createdBy) {
                return false;
            };

            return true;
        };
    };
};