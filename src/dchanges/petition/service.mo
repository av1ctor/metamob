import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Option "mo:base/Option";
import Array "mo:base/Array";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import UserTypes "../user/types";
import UserUtils "../user/utils";
import UserService "../user/service";
import D "mo:base/Debug";

module {
    public class Service(
        userService: UserService.Service
    ) {
        let repo = Repository.Repository();
        
        public func create(
            req: Types.PetitionRequest,
            invoker: Principal
        ): Result.Result<Types.Petition, Text> {
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
            req: Types.PetitionRequest,
            invoker: Principal
        ): Result.Result<Types.Petition, Text> {
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
                            case (#ok(petition)) {
                                if(not canChange(caller, petition)) {
                                    return #err("Forbidden");
                                };
                                
                                return repo.update(petition, req, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func findById(
            id: Text
        ): Result.Result<Types.Petition, Text> {
            repo.findByPubId(id);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Petition], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCategory(
            petitionId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Petition], Text> {
            repo.findByCategory(petitionId, sortBy, limit);
        };

        public func findByTag(
            tagId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Petition], Text> {
            repo.findByTag(tagId, sortBy, limit);
        };

        public func findByUser(
            userId: /* Text */ Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Petition], Text> {
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
                            case (#ok(petition)) {
                                if(not canChange(caller, petition)) {
                                    return #err("Forbidden");
                                };
                                
                                return repo.delete(petition, caller._id);
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

        public func getRepository(
        ): Repository.Repository {
            repo;
        };

        func hasAuth(
            caller: UserTypes.Profile
        ): Bool {
            if(not caller.active) {
                return false;
            };

            if(caller.banned) {
                return false;
            };

            if(UserUtils.isAdmin(caller)) {
                return true;
            };
            
            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            petition: Types.Petition
        ): Bool {
            // not the same author?
            if(caller._id != petition.createdBy) {
                // not an admin?
                if(not UserUtils.isAdmin(caller)) {
                    return false;
                };
            };

            // deleted?
            if(Option.isSome(petition.deletedAt)) {
                return false;
            };

            return true;
        };
    };
};
