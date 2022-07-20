import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import UserTypes "../users/types";
import UserService "../users/service";
import UserUtils "../users/utils";
import PlaceTypes "../places/types";
import PlaceService "../places/service";

module {
    public class Service(
        userService: UserService.Service,
        placeService: PlaceService.Service
    ) {
        let repo = Repository.Repository();
        let placeRepo = placeService.getRepository();

        placeService.setPlacesUsersRepo(repo);

        public func create(
            req: Types.PlaceUserRequest,
            invoker: Principal
        ): Result.Result<Types.PlaceUser, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(repo.findByPlaceIdAndUserId(req.placeId, caller._id)) {
                            case (#ok(e)) {
                                if(not canChange(caller, e)) {
                                    #err("Forbidden");
                                }
                                else {
                                    repo.update(e, req);
                                }
                            };
                            case _ {
                                repo.create(req, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func update(
            req: Types.PlaceUserRequest,
            invoker: Principal
        ): Result.Result<Types.PlaceUser, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(repo.findByPlaceIdAndUserId(req.placeId, caller._id)) {
                            case (#err(msg)) {
                                #err(msg);
                            };
                            case (#ok(e)) {
                                if(not canChange(caller, e)) {
                                    #err("Forbidden");
                                }
                                else {
                                    repo.update(e, req);
                                };
                            };
                        };
                    };
                };
            };
        };
        
        public func findByPlaceIdAndUserId(
            placeId: Nat32,
            userId: Nat32
        ): Result.Result<Types.PlaceUser, Text> {
            repo.findByPlaceIdAndUserId(placeId, userId);
        };

        public func delete(
            _id: Nat32,
            invoker: Principal
        ): Result.Result<(), Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    switch(repo.findById(_id)) {
                        case (#err(msg)) {
                            return #err(msg);
                        };
                        case (#ok(entity)) {
                            if(not hasAuth(caller) or 
                                not canChange(caller, entity)) {
                                #err("Forbidden");
                            }
                            else {
                                repo.delete(entity);
                            }
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

            if(caller.banned == UserTypes.BANNED_AS_USER) {
                return false;
            };

            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            e: Types.PlaceUser
        ): Bool {
            if(caller._id == e.userId) {
                return true;
            }
            else if(UserUtils.isAdmin(caller)) {
                return true;
            };
                
            return false;
        };
    };
};