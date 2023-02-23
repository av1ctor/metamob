import AccountTypes "../accounts/types";
import Array "mo:base/Array";
import D "mo:base/Debug";
import DaoService "../dao/service";
import EmailerHelper "../common/emailer";
import EntityTypes "../common/entities";
import LedgerHelper "../common/ledger";
import ModerationTypes "../moderations/types";
import ModerationService "../moderations/service";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import ReportRepository "../reports/repository";
import ReportTypes "../reports/types";
import Repository "./repository";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Types "./types";
import Utils "./utils";
import Logger "../../logger/main";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        repo: Repository.Repository,
        daoService: DaoService.Service,
        moderationService: ModerationService.Service,
        reportRepo: ReportRepository.Repository,
        ledgerHelper: LedgerHelper.LedgerHelper,
        emailerHelper: EmailerHelper.EmailerHelper,
        logger: Logger.Logger
    ) {
        var hasAdmin: Bool = false;

        public func create(
            req: Types.ProfileRequest,
            invoker: Principal,
            owner: Principal
        ): async* Result.Result<Types.Profile, Text> {
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

            switch(repo.create(invoker, req)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(e)) {
                    ignore emailerHelper.send(
                        [{email = e.email; name = ?e.name;}],
                        EmailerHelper.TEMPLATE_VERIFY,
                        [("verify_link", daoService.config.getAsText("BASE_APP_URL") # "/#/user/verify/" # e.pubId # "/" # e.verifySecret)]
                    );
                    #ok(e);
                };
            };
        };

        public func updateMe(
            req: Types.ProfileRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Profile, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };

            switch(repo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned == Types.BANNED_AS_USER) {
                        return #err("Forbidden: not active");
                    };
                    
                    if(Option.isSome(req.roles) or 
                        Option.isSome(req.active) or
                        Option.isSome(req.banned)) {
                        if(not Utils.isAdmin(caller)) {
                            return #err("Forbidden: invalid fields");
                        };
                    };
                    
                    ignore logger.info(this, "User " # caller.pubId # " updated");
                    repo.update(caller, req, caller._id);
                };
            };
        };

        public func verifyMe(
            req: Types.VerifyRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Profile, Text> {
            switch(repo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(caller.active) {
                        return #err("Already verified");
                    };
                    
                    if(req.secret != caller.verifySecret) {
                        return #err("Invalid secret");
                    };
                    
                    ignore logger.info(this, "User " # caller.pubId # " verified");
                    repo.verify(caller);
                };
            };
        };

        public func update(
            pubId: Text, 
            req: Types.ProfileRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Profile, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };

            switch(repo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned == Types.BANNED_AS_USER) {
                        return #err("Forbidden: not active");
                    };
                    
                    if(not Text.equal(caller.pubId, pubId)) {
                        return #err("Forbidden");
                    };

                    if(Option.isSome(req.roles) or 
                        Option.isSome(req.active) or
                        Option.isSome(req.banned)) {
                        return #err("Forbidden: invalid fields");
                    };

                    ignore logger.info(this, "User " # caller.pubId # " updated");
                    repo.update(caller, req, caller._id);
                };
            };
        };

        public func moderate(
            pubId: Text, 
            req: Types.ProfileRequest,
            mod: ModerationTypes.ModerationRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Profile, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };

            switch(repo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned == Types.BANNED_AS_USER) {
                        return #err("Forbidden: not active");
                    };
                    
                    if(not Utils.isModerator(caller)) {
                        return #err("Forbidden");
                    };

                    switch(repo.findByPubId(pubId)) {
                        case (#err(msg)) {
                            #err(msg);
                        };
                        case (#ok(entity)) {
                            // if it's a moderator, there must exist an open report
                            switch(canModerate(caller, entity, mod)) {
                                case null {
                                    return #err("Forbidden");
                                };
                                case (?report) {
                                    switch(moderationService.create(
                                        mod, report, Variant.hashMapToMap(Repository.serialize(entity, false)), caller)) {
                                        case (#err(msg)) {
                                            #err(msg);
                                        };
                                        case (#ok(moderation)) {
                                            ignore logger.info(this, "User " # entity.pubId # " moderated by " # caller.pubId);
                                            repo.moderate(entity, req, moderation, caller._id);
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        public func revertModeration(
            mod: ModerationTypes.Moderation
        ): Result.Result<(), Text> {
            switch(repo.findById(mod.entityId)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(entity)) {
                    switch(repo.revertModeration(entity, mod)) {
                        case (#err(msg)) {
                            #err(msg);
                        };
                        case _ {
                            #ok()
                        };
                    };
                };
            };
        };

        public func signupAsModerator(
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Profile, Text> {
            switch(repo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned == Types.BANNED_AS_USER) {
                        return #err("Forbidden: not active or banned");
                    };

                    if(caller.banned == Types.BANNED_AS_MODERATOR) {
                        return #err("Forbidden: banned as moderator");
                    };
                    
                    if(Utils.isModerator(caller)) {
                        return #err("Your are already a moderator");
                    };

                    let mmtStaked = daoService.stakedBalanceOf(invoker);
                    let minStaked = Nat64.toNat(daoService.config.getAsNat64("MODERATOR_MIN_STAKE"));
                    if(mmtStaked < minStaked) {
                        return #err("Your staked MMT's are not enough to become a moderator");
                    };
                    
                    ignore logger.info(this, "User " # caller.pubId # " signed as moderator");
                    repo.update(
                        caller, 
                        {
                            active = ?caller.active;
                            avatar = caller.avatar;
                            banned = ?caller.banned;
                            country = caller.country;
                            email = caller.email;
                            name = caller.name;
                            roles = ?_addRole(caller.roles, #moderator);
                        }, 
                        caller._id
                    );
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
                    if(not caller.active or caller.banned == Types.BANNED_AS_USER) {
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
                    if(not caller.active or caller.banned == Types.BANNED_AS_USER) {
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
            ledgerHelper.getAccountId(invoker, this);
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

        func canModerate(
            caller: Types.Profile,
            entity: Types.Profile,
            mod: ModerationTypes.ModerationRequest
        ): ?ReportTypes.Report {
            switch(reportRepo.findById(mod.reportId)) {
                case (#err(_)) {
                    return null;
                };
                case (#ok(report)) {
                    // if it's a moderator, there must exist an open report
                    if(not Utils.isModeratingOnEntity(
                        caller, EntityTypes.TYPE_USERS, entity._id, report)) {
                        return null;
                    };

                    return ?report;
                };
            };
        };

        private func _addRole(
            roles: [Types.Role],
            role: Types.Role
        ): [Types.Role] {
            Array.append(roles, [role]);
        };
        
        private func _removeRole(
            roles: [Types.Role],
            role: Types.Role
        ): [Types.Role] {
            Array.filter(roles, func (r: Types.Role): Bool = r != role)
        };

        public func verify(
            this: actor {}
        ): async* () {
            let minStaked = Nat64.toNat(daoService.config.getAsNat64("MODERATOR_MIN_STAKE"));
            
            switch(repo.findByRole(#moderator)) {
                case (#ok(moderators)) {
                    if(moderators.size() > 0) {
                        for(e in moderators.vals()) {
                            let staked = daoService.stakedBalanceOf(Principal.fromText(e.principal));
                            if(staked < minStaked) {
                                ignore logger.info(this, "UserService.verify: removing moderator: " # Nat32.toText(e._id));
                                ignore repo.update(
                                    e,
                                    {
                                        active = ?e.active;
                                        avatar = e.avatar;
                                        banned = ?e.banned;
                                        country = e.country;
                                        email = e.email;
                                        name = e.name;
                                        roles = ?_removeRole(e.roles, #moderator)
                                    },
                                    1
                                );
                            };
                        };
                    };
                };
                case (#err(msg)) {
                    ignore logger.err(this, "UserService.verify: " # msg);
                };
            };
        };

        public func getRepository(
        ): Repository.Repository {
            repo;
        };
    };
};
