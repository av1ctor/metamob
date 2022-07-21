import Buffer "mo:base/Buffer";
import ChallengeTypes "../challenges/types";
import D "mo:base/Debug";
import DaoService "../dao/service";
import EntityTypes "../common/entities";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Random "../common/random";
import ReportRepository "../reports/repository";
import ReportTypes "../reports/types";
import Repository "./repository";
import Result "mo:base/Result";
import Types "./types";
import UserRepository "../users/repository";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import Utils "../common/utils";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        daoService: DaoService.Service,
        userRepo: UserRepository.Repository,
        reportRepo: ReportRepository.Repository,
    ) {
        let repo = Repository.Repository();

        let random = Random.Xoshiro256ss(Utils.genRandomSeed("judges"));

        public func create(
            req: Types.ModerationRequest,
            report: ReportTypes.Report,
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

            switch(repo.create(req, report, caller._id)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(moderation)) {
                    ignore reportRepo.moderate(report, moderation._id, caller._id);
                    #ok(moderation);
                };
            };
        };

        private func _chooseJudges(
            reporterId: Nat32,
            reportedId: Nat32,
            moderatorId: Nat32
        ): [Nat32] {
            switch(userRepo.findByRole(#moderator)) {
                case (#err(_)) {
                    return [1]; // admin
                };
                case (#ok(moderators)) {
                    if(moderators.size() == 0) {
                        return [1]; // admin;
                    }
                    else {
                        let maxJudges = Nat32.toNat(daoService.configGetAsNat32("CHALLENGE_MAX_JUDGES"));
                        let numJudges = if(moderators.size() < maxJudges) moderators.size() else maxJudges;
                        let judges = Buffer.Buffer<Nat32>(numJudges);
                        var attempts = 0;
                        while(judges.size() < numJudges and attempts < moderators.size()) {
                            let index = Nat64.toNat(random.next() % Nat64.fromNat(moderators.size()));
                            let _id = moderators[index]._id;
                            // judge cannot be the reporter or the reported user or the moderator
                            if(_id != reporterId and _id != reportedId and _id != moderatorId) {
                                judges.add(_id);
                            };

                            attempts += 1;
                        };

                        return judges.toArray();
                    };
                };
            };

            [1]; // admin
        };

        public func challenge(
            _id: Nat32, 
            challenge: ChallengeTypes.Challenge,
            invoker: Principal
        ): async Result.Result<Types.Moderation, Text> {
            switch(userRepo.findByPrincipal(Principal.toText(invoker))) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not UserUtils.isModerator(caller)) {
                        return #err("Forbidden");
                    };
                    
                    switch(repo.findById(_id)) {
                        case (#err(msg)) {
                            #err(msg);
                        };
                        case (#ok(e)) {
                            if(e.state != Types.STATE_CREATED) {
                                return #err("Invalid state");
                            };

                            repo.challenge(e, challenge, caller._id);
                        };
                    };
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