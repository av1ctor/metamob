import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Option "mo:base/Option";
import Time "mo:base/Time";
import Variant "mo:mo-table/variant";
import Random "../common/random";
import Utils "../common/utils";
import Types "./types";
import Repository "./repository";
import EntityTypes "../common/entities";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import UserService "../users/service";
import DaoService "../dao/service";
import ReportTypes "../reports/types";
import ReportService "../reports/service";
import ModerationTypes "../moderations/types";
import ModerationService "../moderations/service";
import CampaignTypes "../campaigns/types";
import CampaignService "../campaigns/service";
import SignatureService "../signatures/service";
import VoteService "../votes/service";
import FundingService "../fundings/service";
import DonationService "../donations/service";
import UpdateService "../updates/service";
import PlaceService "../places/service";
import PoapService "../poap/service";
import NotificationService "../notifications/service";
import Logger "../../logger/logger";
import D "mo:base/Debug";

module {
    public class Service(
        daoService: DaoService.Service,
        userService: UserService.Service,
        campaignService: CampaignService.Service,
        signatureService: SignatureService.Service, 
        voteService: VoteService.Service, 
        fundingService: FundingService.Service, 
        donationService: DonationService.Service, 
        updateService: UpdateService.Service,
        placeService: PlaceService.Service,
        poapService: PoapService.Service,
        reportService: ReportService.Service,
        moderationService: ModerationService.Service,
        notificationService: NotificationService.Service, 
        logger: Logger.Logger
    ) {
        let repo = Repository.Repository();

        let userRepo = userService.getRepository();
        let reportRepo = reportService.getRepository();
        let moderationRepo = moderationService.getRepository();

        let random = Random.Xoshiro256ss(Utils.genRandomSeed("judges"));

        public func create(
            req: Types.ChallengeRequest,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Types.Challenge, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    };

                    switch(moderationRepo.findById(req.moderationId)) {
                        case (#err(_)) {
                            #err("Moderation not found");
                        };
                        case (#ok(moderation)) {
                            if(moderation.state != ModerationTypes.STATE_CREATED) {
                                return #err("Invalid moderation state");
                            };

                            switch(repo.findByEntityAndState(moderation.entityId, moderation.entityType, Types.STATE_VOTING, null, null)) {
                                case (#ok(challenges)) {
                                    if(challenges.size() > 0) {
                                        return #err("Another challenge is open for this entity. Wait until it is closed");
                                    };
                                };
                                case _ {
                                };
                            };
                            
                            switch(reportRepo.findById(moderation.reportId)) {
                                case (#err(_)) {
                                    #err("Report not found");
                                };
                                case (#ok(report)) {
                                    switch(await daoService.deposit(
                                        Nat64.toNat(daoService.config.getAsNat64("CHALLENGER_DEPOSIT")),
                                        Principal.fromText(caller.principal), 
                                        this
                                    )) {
                                        case (#err(msg)) {
                                            return #err(msg);
                                        };
                                        case (#ok()) {
                                        };
                                    };

                                    let judges = _chooseJudges([caller._id, report.entityCreatedBy, moderation.createdBy]);

                                    let dueAt = Time.now() + daoService.config.getAsInt("CHALLENGE_VOTING_SPAN");

                                    switch(repo.create(req, moderation.entityId, moderation.entityType, judges, dueAt, caller._id)) {
                                        case (#err(msg)) {
                                            ignore await daoService.reimburse(
                                                Nat64.toNat(daoService.config.getAsNat64("CHALLENGER_DEPOSIT")),
                                                Principal.fromText(caller.principal), 
                                                this);
                                            #err(msg);
                                        };
                                        case (#ok(challenge)) {
                                            ignore moderationRepo.challenge(moderation, challenge._id, caller._id);

                                            ignore logger.info(this, "Moderation " # moderation.pubId # " was challenged");
                                            ignore notificationService.create({
                                                title = "Moderation challenged";
                                                body = "Your Moderation with id " # moderation.pubId # " was challenged.";
                                            }, moderation.createdBy);

                                            for(judge in judges.vals()) {
                                                ignore notificationService.create({
                                                    title = "Challenge assigned";
                                                    body = "The challenge " # challenge.pubId # " was assigned to you.";
                                                }, judge);
                                            };

                                            #ok(challenge);
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        private func _chooseJudges(
            toExclude: [Nat32]
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
                        let attempted = Array.init<Bool>(moderators.size(), false);
                        var attempts = 0;
                        while(judges.size() < numJudges and attempts < moderators.size()) {
                            let index = Nat64.toNat(random.next() % Nat64.fromNat(moderators.size()));
                            if(not attempted[index]) {
                                attempted[index] := true;
                                attempts += 1;

                                let _id = moderators[index]._id;
                                
                                if(Option.isNull(Array.find(toExclude, func(id: Nat32): Bool = _id == id))) {
                                    judges.add(_id);
                                };
                            };
                        };

                        if(judges.size() > 0) {
                            return Buffer.toArray(judges);
                        };
                    };
                };
            };

            [1]; // admin
        };

        public func update(
            id: Text, 
            req: Types.ChallengeRequest,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Types.Challenge, Text> {
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

                                if(e.state != Types.STATE_VOTING) {
                                    return #err("Invalid state");
                                };

                                if(e.votes.size() > 0) {
                                    return #err("There are votes already cast");
                                };

                                ignore logger.info(this, "Challenge " # e.pubId # " was updated by " # caller.pubId);
                                repo.update(e, req, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func vote(
            id: Text, 
            req: Types.ChallengeVoteRequest,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Types.Challenge, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not UserUtils.isModerator(caller)) {
                        return #err("Forbidden");
                    };
                    
                    switch(repo.findByPubId(id)) {
                        case (#err(msg)) {
                            #err(msg);
                        };
                        case (#ok(e)) {
                            if(e.state != Types.STATE_VOTING) {
                                return #err("Invalid state");
                            };

                            if(Option.isNull(Array.find(e.judges, func (j: Nat32): Bool = j == caller._id))) {
                                return #err("Forbidden: not a judge");
                            };

                            if(Option.isSome(Array.find(e.votes, func (v: Types.ChallengeVote): Bool = v.judgeId == caller._id))) {
                                return #err("Forbidden: vote already cast");
                            };

                            let buff = Buffer.Buffer<Types.ChallengeVote>(e.judges.size());
                            for(v in e.votes.vals()) {
                                buff.add(v);
                            };

                            buff.add({
                                judgeId = caller._id;
                                pro = req.pro;
                                reason = req.reason;
                            });

                            let votes = Buffer.toArray(buff);

                            if(votes.size() == e.judges.size()) {
                                let result = _calcResult(votes);
                                switch(repo.close(e, result, votes, caller._id))
                                {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(challange)) {
                                        switch(moderationRepo.findById(e.moderationId)) {
                                            case (#err(msg)) {
                                                return #err(msg);
                                            };
                                            case (#ok(moderation)) {
                                                ignore moderationRepo.closeChallenge(moderation, result);

                                                if(result == Types.RESULT_ACCEPTED) {
                                                    switch(userService.findById(e.createdBy)) {
                                                        case (#err(_)) {
                                                        };
                                                        case (#ok(challenger)) {
                                                            ignore _revertModeration(moderation);

                                                            ignore await daoService.reimburse(
                                                                Nat64.toNat(daoService.config.getAsNat64("CHALLENGER_DEPOSIT")),
                                                                Principal.fromText(challenger.principal), 
                                                                this
                                                            );

                                                            ignore logger.info(this, "Challenge " # e.pubId # " was accepted");
                                                            ignore notificationService.create({
                                                                title = "Challenge accepted";
                                                                body = "Your challenge with id " # e.pubId # " was accepted and the MMT you deposited was reimbursed!";
                                                            }, challenger._id);

                                                            await _punishModerator(moderation.createdBy, e, "reverted", this);
                                                        };
                                                    };
                                                }
                                                else {
                                                    switch(userService.findById(e.createdBy)) {
                                                        case (#err(_)) {
                                                        };
                                                        case (#ok(challenger)) {
                                                            ignore daoService.punishDepositor(
                                                                Principal.fromText(challenger.principal), 
                                                                Nat64.toNat(daoService.config.getAsNat64("CHALLENGER_DEPOSIT"))
                                                            );

                                                            ignore logger.info(this, "Challenge " # e.pubId # " was refused");
                                                            ignore notificationService.create({
                                                                title = "Challenge refused";
                                                                body = "Your challenge with id " # e.pubId # " was refused and as punishment the MMT you deposited is lost.";
                                                            }, challenger._id);
                                                        };
                                                    };
                                                };
                                            };
                                        };

                                        #ok(challange);
                                    };
                                };
                            }
                            else {
                                repo.vote(e, votes, caller._id);
                            };
                        };
                    };
                };
            };
        };

        func _punishModerator(
            userId: Nat32,
            challenge: Types.Challenge,
            reason: Text,
            this: actor {}
        ): async () {
            switch(userService.findById(userId)) {
                case (#err(_)) {
                };
                case (#ok(moderator)) {
                    ignore daoService.punishStaker(
                        Principal.fromText(moderator.principal), 
                        Nat64.toNat(daoService.config.getAsNat64("MODERATOR_PUNISHMENT"))
                    );

                    if(reason == "reverted") {
                        ignore logger.info(this, "Moderator " # moderator.pubId # " was punished because the challenge " # challenge.pubId # " was accepted");
                        ignore notificationService.create({
                            title = "Moderation reverted";
                            body = "The challenge with id " # challenge.pubId # " was accepted, reverting one of your moderations. As punishment, you lost part of your staked MMT.";
                        }, userId);
                    }
                    else {
                        ignore logger.info(this, "Moderator " # moderator.pubId # " was punished because the challenge " # challenge.pubId # " expired");
                        ignore notificationService.create({
                            title = "Challenge expired";
                            body = "The challenge with id " # challenge.pubId # " expired and you didn't vote in time. As punishment, you lost part of your staked MMT.";
                        }, userId);
                    };
                };
            };
        };

        func _revertModeration(
            moderation: ModerationTypes.Moderation
        ): async Result.Result<(), Text> {
            if(moderation.entityType == EntityTypes.TYPE_CAMPAIGNS) {
                await campaignService.revertModeration(moderation);
            }
            else if(moderation.entityType == EntityTypes.TYPE_DONATIONS) {
                donationService.revertModeration(moderation);
            }
            else if(moderation.entityType == EntityTypes.TYPE_FUNDINGS) {
                fundingService.revertModeration(moderation);
            }
            else if(moderation.entityType == EntityTypes.TYPE_PLACES) {
                placeService.revertModeration(moderation);
            }
            else if(moderation.entityType == EntityTypes.TYPE_SIGNATURES) {
                signatureService.revertModeration(moderation);
            }
            else if(moderation.entityType == EntityTypes.TYPE_UPDATES) {
                updateService.revertModeration(moderation);
            }
            else if(moderation.entityType == EntityTypes.TYPE_USERS) {
                userService.revertModeration(moderation);
            }
            else if(moderation.entityType == EntityTypes.TYPE_VOTES) {
                voteService.revertModeration(moderation);
            }
            else /*if(moderation.entityType == EntityTypes.TYPE_POAPS)*/ {
                poapService.revertModeration(moderation);
            };
        };

        func _calcResult(
            votes: [Types.ChallengeVote]
        ): Types.ChallengeResult {
            let half = (votes.size() * 100) / 2;
            if((Array.filter(votes, func (v: Types.ChallengeVote): Bool = v.pro).size() * 100) >= half) {
                Types.RESULT_ACCEPTED;
            }
            else {
                Types.RESULT_REFUSED;
            };
        };

        public func findById(
            _id: Nat32,
            invoker: Principal
        ): Result.Result<Types.Challenge, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    let res = repo.findById(_id);
                    switch(res) {
                        case (#ok(e)) {
                            if(e.createdBy != caller._id) {
                                if(not _isJudge(caller._id, e)) {
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

        public func findByPubId(
            id: Text,
            invoker: Principal
        ): Result.Result<Types.Challenge, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    let res = repo.findByPubId(id);
                    switch(res) {
                        case (#ok(e)) {
                            if(e.createdBy != caller._id) {
                                if(not _isJudge(caller._id, e)) {
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

        public func getModeration(
            _id: Nat32,
            invoker: Principal
        ): Result.Result<ModerationTypes.Moderation, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    switch(repo.findById(_id)) {
                        case (#err(msg)) {
                            #err(msg);
                        };
                        case (#ok(e)) {
                            if(not _isJudge(caller._id, e)) {
                                return #err("Forbidden");
                            };

                            moderationRepo.findById(e.moderationId);
                        };
                    };
                };
            };
        };

        func _isJudge(
            userId: Nat32,
            challenge: Types.Challenge
        ): Bool {
            Option.isSome(Array.find(challenge.judges, func(j: Nat32): Bool = j == userId));
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Challenge], Text> {
            switch(userService.findByPrincipal(invoker)) {
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

        public func findByUser(
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Challenge], Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    repo.findByUser(caller._id, sortBy, limit);
                };
            };
        };

        public func findByJudge(
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Challenge], Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    repo.findByJudge(caller._id, sortBy, limit);
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

        public func verify(
            this: actor {}
        ): async () {
            let dueAt = Time.now() + daoService.config.getAsInt("CHALLENGE_VOTING_SPAN");

            switch(repo.findDue(100)) {
                case (#ok(challenges)) {
                    if(challenges.size() > 0) {
                        ignore logger.info(this, "ChallengeService.verify: Selecting new jury for " # Nat.toText(challenges.size()) # " challenges");
                        for(challenge in challenges.vals()) {
                            let toPunish = _selectNewJury(challenge, dueAt);
                            for(userId in toPunish.vals()) {
                                await _punishModerator(userId, challenge, "expired", this);
                            };
                        };
                    };
                };
                case (#err(msg)) {
                    ignore logger.err(this, "ChallengeService.verify: " # msg);
                };
            };
        };

        func _selectNewJury(
            challenge: Types.Challenge,
            dueAt: Int
        ): [Nat32] {
            let toExclude = Buffer.Buffer<Nat32>(5);
            for(judgeId in challenge.judges.vals()) {
                if(Option.isNull(Array.find(challenge.votes, func(v: Types.ChallengeVote): Bool = v.judgeId == judgeId))) {
                    toExclude.add(judgeId);
                };
            };
            
            let judges = _chooseJudges(Buffer.toArray(toExclude));
            ignore repo.updateJudges(challenge, judges, dueAt);

            Buffer.toArray(toExclude);
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

            if(caller.banned == UserTypes.BANNED_AS_MODERATOR) {
                return false;
            };

            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            e: Types.Challenge
        ): Bool {
            if(caller._id == e.createdBy) {
                return true;
            };
                
            return false;
        };
    };
};