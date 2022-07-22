import DIP20 "../common/dip20";
import DIP721 "../common/dip721";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import EntityTypes "../common/entities";
import ModerationTypes "../moderations/types";
import ModerationService "../moderations/service";
import PlacesEmailsRepo "../places-emails/repository";
import PlacesUsersRepo "../places-users/repository";
import Principal "mo:base/Principal";
import ReportRepository "../reports/repository";
import ReportTypes "../reports/types";
import Repository "./repository";
import Result "mo:base/Result";
import Types "./types";
import UserService "../users/service";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        userService: UserService.Service,
        moderationService: ModerationService.Service,
        reportRepo: ReportRepository.Repository
    ) {
        let repo = Repository.Repository();
        var placesEmailsRepo: ?PlacesEmailsRepo.Repository = null;
        var placesUsersRepo: ?PlacesUsersRepo.Repository = null;

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
                        if(req.kind <= Types.KIND_COUNTRY) {
                            if(not UserUtils.isModerator(caller)) {
                                return #err("Forbidden place kind");
                            };
                        };
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

        public func moderate(
            id: Text, 
            req: Types.PlaceRequest,
            mod: ModerationTypes.ModerationRequest,
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
                                switch(canModerate(caller, e, mod)) {
                                    case null {
                                        return #err("Forbidden");
                                    };
                                    case (?report) {
                                        switch(moderationService.create(mod, report, caller)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case (#ok(moderation)) {
                                                repo.moderate(e, req, mod.reason, caller._id);
                                            };
                                        };
                                    };
                                };
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
                    #err("Places-emails repository undefined");
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
            let balance = await DIP20.balanceOf(res.canisterId, Principal.fromText(caller.principal));
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
            let balance = await DIP721.balanceOf(res.canisterId, Principal.fromText(caller.principal));
            if(balance < res.minValue) {
                #err("Forbidden: not enough DIP721 balance");
            }
            else {
                #ok();
            };
        };

        private func _checkTermsAccepted(
            caller: UserTypes.Profile,
            placeId: Nat32
        ): Result.Result<(), Text> {
            switch(placesUsersRepo) {
                case null {
                    #err("Places-users repository undefined");
                };
                case (?placesUsers) {
                    switch(placesUsers.findByPlaceIdAndUserId(placeId, caller._id)) {
                        case (#err(_)) {
                            #err("Forbidden: terms and conditions were not accepted yet");
                        };
                        case (#ok(e)) {
                            if(e.termsAccepted) {
                                #ok();
                            }
                            else {
                                #err("Forbidden: terms and conditions were not accepted yet");
                            };
                        };
                    };
                };
            };
        };

        public func checkAccessEx(
            caller: UserTypes.Profile,
            _id: Nat32,
            checkTerms: Bool
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
                        if(UserUtils.isModerator(caller)) {
                            return #ok();
                        };

                        if(checkTerms and Option.isSome(place.terms)) {
                            switch(_checkTermsAccepted(caller, _id)) {
                                case (#err(msg)) {
                                    return #err(msg);
                                };
                                case _ {
                                };
                            };
                        };

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

        public func checkAccess(
            caller: UserTypes.Profile,
            _id: Nat32
        ): async Result.Result<(), Text> {
            await checkAccessEx(caller, _id, true);
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

        public func setPlacesUsersRepo(
            repo: PlacesUsersRepo.Repository
        ) {
            placesUsersRepo := ?repo;
        };

        func hasAuth(
            caller: UserTypes.Profile
        ): Bool {
            if(not caller.active) {
                return false;
            };

            if(caller.banned != UserTypes.BANNED_NONE) {
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
            if(caller._id != e.createdBy) {
                return false;
            };
                
            return true;
        };

        func canModerate(
            caller: UserTypes.Profile,
            e: Types.Place,
            mod: ModerationTypes.ModerationRequest
        ): ?ReportTypes.Report {
            if(not UserUtils.isModerator(caller)) {
                return null;
            };
                    
            switch(reportRepo.findById(mod.reportId)) {
                case (#err(_)) {
                    return null;
                };
                case (#ok(report)) {
                    // if it's a moderator, there must exist an open report
                    if(not UserUtils.isModeratingOnEntity(
                        caller, EntityTypes.TYPE_PLACES, e._id, report)) {
                        return null;
                    };

                    return ?report;
                };
            };
        };
    };
};