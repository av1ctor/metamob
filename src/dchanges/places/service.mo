import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import UserService "../users/service";
import PlacesEmailsRepo "../places-emails/repository";
import DIPTypes "../common/dip";

module {
    public class Service(
        userService: UserService.Service
    ) {
        let repo = Repository.Repository();
        var placesEmailsRepo: ?PlacesEmailsRepo.Repository = null;

        public func create(
            req: Types.PlaceRequest,
            invoker: Principal
        ): Result.Result<Types.Place, Text> {
            switch(userService.findByPrincipal(invoker)) {
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
            req: Types.PlaceRequest,
            invoker: Principal
        ): Result.Result<Types.Place, Text> {
            switch(userService.findByPrincipal(invoker)) {
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
                            case (#ok(e)) {
                                if(not canChange(caller, e)) {
                                    return #err("Forbidden");
                                };

                                repo.update(e, req, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Place, Text> {
            repo.findById(_id);
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Place, Text> {
            repo.findByPubId(pubId);
        };

        public func findTreeById(
            _id: Nat32
        ): Result.Result<[Types.Place], Text> {
            repo.findTreeById(_id);
        };

        public func findByUser(
            userId: /* Text */ Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Place], Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    };

                    if(caller._id != userId) {
                        if(not UserUtils.isAdmin(caller)) {
                            return #err("Forbidden");
                        };
                    };
                    
                    repo.findByUser(userId, sortBy, limit);
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Place], Text> {
            repo.find(criterias, sortBy, limit);
        };

        private func _checkEmail(
            caller: UserTypes.Profile,
            _id: Nat32
        ): Result.Result<(), Text> {
            switch(placesEmailsRepo) {
                case (null) {
                    #err("E-mails table undefined");
                };
                case (?emails) {
                    switch(emails.findByPlaceIdAndEmail(_id, caller.email)) {
                        case (#err(_)) {
                            #err("Forbidden: e-mail not found");
                        };
                        case _ {
                            #ok();
                        };
                    };
                };
            };
        };

        private func _checkDip20(
            caller: UserTypes.Profile,
            res: Types.PlaceDip20Auth
        ): async Result.Result<(), Text> {
            let dip20 = actor (res.canisterId) : DIPTypes.DIP20Interface;
            
            let balance = await dip20.balanceOf(Principal.fromText(caller.principal));
            if(balance < res.minValue) {
                #err("Forbidden: not enough DIP20 balance");
            }
            else {
                #ok();
            };
        };

        private func _checkDip721(
            caller: UserTypes.Profile,
            res: Types.PlaceDip20Auth
        ): async Result.Result<(), Text> {
            let dip721 = actor (res.canisterId) : DIPTypes.DIP721Interface;
            
            let balance = await dip721.balanceOf(Principal.fromText(caller.principal));
            if(balance < res.minValue) {
                #err("Forbidden: not enough DIP721 balance");
            }
            else {
                #ok();
            };
        };

        public func checkAccess(
            caller: UserTypes.Profile,
            _id: Nat32
        ): async Result.Result<(), Text> {
            switch(repo.findById(_id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(place)) {
                    if(not place.active) {
                        #err("Place inactive");
                    }
                    else {
                        switch(place.auth) {
                            case (#none_) {
                                #ok();
                            };
                            case (#email) {
                                _checkEmail(caller, _id);
                            };
                            case (#dip20(res)) {
                                await _checkDip20(caller, res);
                            };
                            case (#dip721(res)) {
                                await _checkDip721(caller, res);
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

        public func setPlacesEmailsRepo(
            repo: PlacesEmailsRepo.Repository
        ) {
            placesEmailsRepo := ?repo;
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
            e: Types.Place
        ): Bool {
            if(caller._id == e.createdBy) {
                return true;
            }
            else if(UserUtils.isAdmin(caller)) {
                return true;
            };
                
            return false;
        };
    };
};