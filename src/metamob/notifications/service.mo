import EntityTypes "../common/entities";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Repository "./repository";
import Result "mo:base/Result";
import Types "./types";
import UserRepository "../users/repository";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        userRepo: UserRepository.Repository
    ) {
        let repo = Repository.Repository();

        public func create(
            req: Types.NotificationRequest,
            callerId: Nat32
        ): Result.Result<Types.Notification, Text> {
            repo.create(req, callerId);
        };

        public func markAsRead(
            id: Text,
            invoker: Principal
        ): Result.Result<Types.Notification, Text> {
            switch(userRepo.findByPrincipal(Principal.toText(invoker))) {
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
                            case (#ok(entity)) {
                                if(not canChange(caller, entity)) {
                                    return #err("Forbidden");
                                };
                                
                                repo.markAsRead(entity);
                            };
                        };
                    };
                };
            };
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Notification, Text> {
            repo.findByPubId(pubId);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Notification], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByUser(
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Notification], Text> {
            switch(userRepo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    repo.findByUser(caller._id, sortBy, limit);
                };
            };
        };

        public func countUnreadByUser(
            invoker: Principal
        ): Result.Result<Nat32, Text> {
            switch(userRepo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    repo.countUnreadByUser(caller._id);
                };
            };
        };

        public func delete(
            id: Text,
            invoker: Principal
        ): Result.Result<(), Text> {
            switch(userRepo.findByPrincipal(Principal.toText(invoker))) {
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
                            case (#ok(entity)) {
                                if(not canChange(caller, entity)) {
                                    return #err("Forbidden");
                                };
                                
                                repo.delete(entity);
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

            if((caller.banned & UserTypes.BANNED_AS_USER) > 0) {
                return false;
            };

            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            entity: Types.Notification
        ): Bool {
            if(caller._id != entity.createdBy) {
                return false;
            };

            return true;
        };
    };
};