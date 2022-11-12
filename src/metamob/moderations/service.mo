import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import ChallengeTypes "../challenges/types";
import D "mo:base/Debug";
import DaoService "../dao/service";
import EntityTypes "../common/entities";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import ReportRepository "../reports/repository";
import ReportTypes "../reports/types";
import Repository "./repository";
import Result "mo:base/Result";
import Types "./types";
import UserRepository "../users/repository";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import Utils "../common/utils";
import NotificationService "../notifications/service";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        daoService: DaoService.Service,
        userRepo: UserRepository.Repository,
        reportRepo: ReportRepository.Repository,
        notificationService: NotificationService.Service
    ) {
        let repo = Repository.Repository();

        public func create(
            req: Types.ModerationRequest,
            report: ReportTypes.Report,
            original: [Variant.MapEntry],
            caller: UserTypes.Profile
        ): Result.Result<Types.Moderation, Text> {
            if(report.state != ReportTypes.STATE_ASSIGNED) {
                return #err("Invalid report state");
            };

            if(report.assignedTo != caller._id) {
                return #err("Caller is not the report's moderator");
            };

            if((req.reason < Types.REASON_FAKE or 
                req.reason > Types.REASON_OFFENSIVE) and
                req.reason != Types.REASON_OTHER) {
                return #err("Invalid reason");
            };

            if(req.action < Types.ACTION_FLAGGED or 
                req.action > Types.ACTION_REDACTED) {
                return #err("Invalid action");
            };

            switch(repo.create(req, report, original, caller._id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(moderation)) {
                    ignore notificationService.create({
                        title = EntityTypes.toText(report.entityType) # " moderated";
                        body = "Your " # EntityTypes.toText(report.entityType) # " with id " # report.entityPubId # " was moderated.";
                    }, report.entityCreatedBy);

                    ignore reportRepo.moderate(report, moderation._id, caller._id);
                    #ok(moderation);
                };
            };
        };

        public func findById(
            id: Text,
            invoker: Principal
        ): Result.Result<Types.Moderation, Text> {
            switch(userRepo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    let res = repo.findByPubId(id);
                    switch(res) {
                        case (#ok(e)) {
                            if(e.createdBy != caller._id) {
                                if(not UserUtils.isModerator(caller)) {
                                    return #err("Forbidden");
                                };
                            };
                        };
                        case _ {
                        };
                    };

                    res;
                };
            };
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Moderation], Text> {
            switch(userRepo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not UserUtils.isModerator(caller)) {
                        return #err("Forbidden");
                    };
                    repo.find(criterias, sortBy, limit);
                };
            };
        };

        public func findByEntity(
            entityType: EntityTypes.EntityType,
            entityId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Moderation], Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };
            
            repo.findByEntity(entityType, entityId, sortBy, limit);
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
            e: Types.Moderation
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