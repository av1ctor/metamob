import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import UserTypes "../user/types";
import UserUtils "../user/utils";
import UserService "../user/service";

module {
    public class Service(
        userService: UserService.Service
    ) {
        let repo = Repository.Repository();

        public func create(
            req: Types.TagRequest,
            invoker: Principal
        ): Result.Result<Types.Tag, Text> {
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
            req: Types.TagRequest,
            invoker: Principal
        ): Result.Result<Types.Tag, Text> {
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
                        switch(repo.findByPubId(id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(tag)) {
                                repo.update(tag, req, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Tag, Text> {
            repo.findById(_id);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Tag], Text> {
            repo.find(criterias, sortBy, limit);
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
                        #err("Forbidden");
                    }
                    else {
                        switch(repo.findByPubId(id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(tag)) {
                                repo.delete(tag);
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
            UserUtils.isAdmin(caller);
        };
    };
};