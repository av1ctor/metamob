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

        placeService.setPlacesEmailsRepo(repo);

        public func create(
            req: Types.PlaceEmailRequest,
            invoker: Principal
        ): Result.Result<Types.PlaceEmail, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller, req.placeId)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(repo.findByPlaceIdAndEmail(req.placeId, req.email)) {
                            case (#ok(_)) {
                                #err("Duplicated");
                            };
                            case _ {
                                repo.create(req);
                            };
                        };
                    };
                };
            };
        };
        
        public func findByPlaceId(
            placeId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.PlaceEmail], Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller, placeId)) {
                        #err("Forbidden");
                    }
                    else {
                        repo.findByPlaceId(placeId, sortBy, limit);
                    };
                };
            };
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
                            if(not hasAuth(caller, entity.placeId)) {
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
            caller: UserTypes.Profile,
            placeId: Nat32
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

            switch(placeRepo.findById(placeId)) {
                case (#err(_)) {
                    return false;
                };
                case (#ok(place)) {
                    if(place.createdBy != caller._id) {
                        return false;
                    };
                };
            };
            
            return true;
        };
    };
};