import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Array "mo:base/Array";
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
import CampaignTypes "../campaigns/types";
import CampaignService "../campaigns/service";
import SignatureService "../signatures/service";
import VoteService "../votes/service";
import FundingService "../fundings/service";
import DonationService "../donations/service";
import UpdateService "../updates/service";
import PlaceService "../places/service";
import DaoService "../dao/service";
import PoapService "../poap/service";
import NotificationService "../notifications/service";
import Logger "../../logger/main";
import D "mo:base/Debug";

module {
    public class Service(
        repo: Repository.Repository,
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
        notificationService: NotificationService.Service, 
        logger: Logger.Logger
    ) {
        let campaignRepo = campaignService.getRepository();
        let userRepo = userService.getRepository();
        let signatureRepo = signatureService.getRepository();
        let voteRepo = voteService.getRepository();
        let fundingRepo = fundingService.getRepository();
        let donationRepo = donationService.getRepository();
        let updateRepo = updateService.getRepository();
        let placeRepo = placeService.getRepository();
        let poapRepo = poapService.getRepository();

        let random = Random.Xoshiro256ss(Utils.genRandomSeed("moderators"));

        public func create(
            req: Types.ReportRequest,
            invoker: Principal
        ): Result.Result<Types.Report, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(_checkEntity(req)) {
                            case (#err(msg)) {
                                #err(msg);
                            };
                            case (#ok(entityCreatedBy)) {
                                let moderatorId = _chooseModerator([caller._id, entityCreatedBy]);
                                
                                let dueAt = Time.now() + daoService.config.getAsInt("REPORT_MODERATING_SPAN");
                                switch(repo.create(req, entityCreatedBy, caller._id, moderatorId, dueAt)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(report)) {
                                        ignore notificationService.create({
                                            title = "Report opened";
                                            body = "The report " # report.pubId # " was opened against your " # EntityTypes.toText(req.entityType) # " with id " # req.entityPubId;
                                        }, entityCreatedBy);

                                        ignore notificationService.create({
                                            title = "Report assigned";
                                            body = "The report " # report.pubId # " was assigned to you.";
                                        }, moderatorId);

                                        #ok(report);
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        private func _chooseModerator(
            toExclude: [Nat32]
        ): Nat32 {
            switch(userRepo.findByRole(#moderator)) {
                case (#err(_)) {
                    return 1; // admin
                };
                case (#ok(moderators)) {
                    var attempts = 0;
                    while(attempts < moderators.size()) {
                        let index = Nat64.toNat(random.next() % Nat64.fromNat(moderators.size()));
                        let _id = moderators[index]._id;
                        if(Option.isNull(Array.find(toExclude, func(id: Nat32): Bool = _id == id))) {
                            return _id;
                        };

                        attempts += 1;
                    };
                };
            };

            1; // admin
        };

        public func update(
            id: Text, 
            req: Types.ReportRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Report, Text> {
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

                                switch(_checkEntity(req)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        if(e.state != Types.STATE_CREATED and
                                            e.state != Types.STATE_ASSIGNED) {
                                            return #err("Invalid state");
                                        };
                                        
                                        ignore logger.info(this, "Report " # e.pubId # " updated by " # caller.pubId);
                                        repo.update(e, req, caller._id);
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        public func close(
            id: Text, 
            req: Types.ReportCloseRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Report, Text> {
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
                            if(e.state != Types.STATE_ASSIGNED and e.state != Types.STATE_MODERATING) {
                                return #err("Invalid state");
                            };

                            if(e.assignedTo != caller._id) {
                                return #err("Forbidden");
                            };

                            if(e.state == Types.STATE_MODERATING) {
                                if(req.result != Types.RESULT_MODERATED) {
                                    return #err("Reported entity must be moderated");
                                };

                                switch(e.moderationId) {
                                    case null {
                                        return #err("Reported entity was not moderated");
                                    };
                                    case _ {
                                    };
                                };
                            };

                            let res = repo.close(e, req, caller._id);

                            if(req.result == Types.RESULT_MODERATED) {
                                switch(userService.findById(e.createdBy)) {
                                    case (#err(_)) {
                                    };
                                    case (#ok(reporter)) {
                                        let reportReward = daoService.config.getAsNat64("REPORTER_REWARD");
                                        ignore await* daoService.rewardUser(Principal.fromText(reporter.principal), reportReward, this);

                                        ignore logger.info(this, "User " # reporter.pubId # " received a reward because his report was accepted");
                                        ignore notificationService.create({
                                            title = "Reward received";
                                            body = "You received " # Utils.e8sToDecimal(reportReward) # " MMT as reward for your report!";
                                        }, e.createdBy);
                                    };
                                };
                            } 
                            else {
                                ignore notificationService.create({
                                    title = "Report refused";
                                    body = "Sorry. Your report " # e.pubId # " was not accepted. You will not receive a reward.";
                                }, e.createdBy);
                            };

                            let modReward = daoService.config.getAsNat64("MODERATOR_REWARD");
                            ignore await* daoService.rewardUser(invoker, modReward, this);

                            ignore logger.info(this, "Moderator " # caller.pubId # " received a reward because he moderated a report");
                            ignore notificationService.create({
                                title = "Reward received";
                                body = "You received " # Utils.e8sToDecimal(modReward) # " MMT as reward for your moderation!";
                            }, caller._id);

                            res;
                        };
                    };
                };
            };
        };        

        public func findById(
            id: Text,
            invoker: Principal
        ): Result.Result<Types.Report, Text> {
            switch(userService.findByPrincipal(invoker)) {
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
        ): Result.Result<[Types.Report], Text> {
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
        ): Result.Result<[Types.Report], Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    repo.findByUser(caller._id, sortBy, limit);
                };
            };
        };

        public func findByReportedUser(
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Report], Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    repo.findByReportedUser(caller._id, sortBy, limit);
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
        ): async* () {
            let dueAt = Time.now() + daoService.config.getAsInt("REPORT_MODERATING_SPAN");

            switch(repo.findDue(100)) {
                case (#ok(reports)) {
                    if(reports.size() > 0) {
                        ignore logger.info(this, "ReportService.verify: Selecting new moderator for " # Nat.toText(reports.size()) # " reports");
                        for(report in reports.vals()) {
                            _selectNewModerator(report, dueAt);
                            _punishModerator(report.assignedTo);
                        };
                    };
                };
                case (#err(msg)) {
                    ignore logger.err(this, "ReportService.verify: " # msg);
                };
            };
        };

        func _selectNewModerator(
            report: Types.Report,
            dueAt: Int
        ) {
            let mod = _chooseModerator([report.assignedTo]);
            ignore repo.updateModerator(report, mod, dueAt);
        };

        func _punishModerator(
            userId: Nat32
        ) {
            switch(userService.findById(userId)) {
                case (#err(_)) {
                };
                case (#ok(moderator)) {
                    ignore daoService.punishStaker(
                        Principal.fromText(moderator.principal), 
                        Nat64.toNat(daoService.config.getAsNat64("MODERATOR_PUNISHMENT"))
                    );
                };
            };
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
            e: Types.Report
        ): Bool {
            if(caller._id == e.createdBy) {
                return true;
            };
                
            return false;
        };

        func _checkEntity(
            req: Types.ReportRequest
        ): Result.Result<Nat32, Text> {
            if(req.entityType == EntityTypes.TYPE_CAMPAIGNS) {
                switch(campaignRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(e)) {
                        if(not Text.equal(e.pubId, req.entityPubId)) {
                            #err("Wrong pubId");
                        }
                        else {
                            #ok(e.createdBy);
                        };
                    };
                };
            }
            else if(req.entityType == EntityTypes.TYPE_USERS) {
                switch(userRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(e)) {
                        if(not Text.equal(e.pubId, req.entityPubId)) {
                            #err("Wrong pubId");
                        }
                        else {
                            #ok(e._id);
                        };
                    };
                };
            }
            else if(req.entityType == EntityTypes.TYPE_SIGNATURES) {
                switch(signatureRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(e)) {
                        if(not Text.equal(e.pubId, req.entityPubId)) {
                            #err("Wrong pubId");
                        }
                        else {
                            #ok(e.createdBy);
                        };
                    };
                };
            }
            else if(req.entityType == EntityTypes.TYPE_VOTES) {
                switch(voteRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(e)) {
                        if(not Text.equal(e.pubId, req.entityPubId)) {
                            #err("Wrong pubId");
                        }
                        else {
                            #ok(e.createdBy);
                        };
                    };
                };
            }
            else if(req.entityType == EntityTypes.TYPE_FUNDINGS) {
                switch(fundingRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(e)) {
                        if(not Text.equal(e.pubId, req.entityPubId)) {
                            #err("Wrong pubId");
                        }
                        else {
                            #ok(e.createdBy);
                        };
                    };
                };
            }
            else if(req.entityType == EntityTypes.TYPE_DONATIONS) {
                switch(donationRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(e)) {
                        if(not Text.equal(e.pubId, req.entityPubId)) {
                            #err("Wrong pubId");
                        }
                        else {
                            #ok(e.createdBy);
                        };
                    };
                };
            }            
            else if(req.entityType == EntityTypes.TYPE_UPDATES) {
                switch(updateRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(e)) {
                        if(not Text.equal(e.pubId, req.entityPubId)) {
                            #err("Wrong pubId");
                        }
                        else {
                            #ok(e.createdBy);
                        };
                    };
                };
            }
            else if(req.entityType == EntityTypes.TYPE_PLACES) {
                switch(placeRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(e)) {
                        if(not Text.equal(e.pubId, req.entityPubId)) {
                            #err("Wrong pubId");
                        }
                        else {
                            #ok(e.createdBy);
                        };
                    };
                };
            }
            else /*if(req.entityType == EntityTypes.TYPE_POAP)*/ {
                switch(poapRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(e)) {
                        if(not Text.equal(e.pubId, req.entityPubId)) {
                            #err("Wrong pubId");
                        }
                        else {
                            #ok(e.createdBy);
                        };
                    };
                };
            };
        };        
    };
};