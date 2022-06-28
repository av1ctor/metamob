import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Option "mo:base/Option";
import Variant "mo:mo-table/variant";
import Random "../common/random";
import Utils "../common/utils";
import Types "./types";
import Repository "./repository";
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
        placeService: PlaceService.Service
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();
        let userRepo = userService.getRepository();
        let signatureRepo = signatureService.getRepository();
        let voteRepo = voteService.getRepository();
        let fundingRepo = fundingService.getRepository();
        let donationRepo = donationService.getRepository();
        let updateRepo = updateService.getRepository();
        let placeRepo = placeService.getRepository();

        let random = Random.Xoshiro256ss(Utils.genRandomSeed("moderators"));

        campaignService.setReportRepo(repo);
        userService.setReportRepo(repo);
        signatureService.setReportRepo(repo);
        voteService.setReportRepo(repo);
        fundingService.setReportRepo(repo);
        donationService.setReportRepo(repo);
        updateService.setReportRepo(repo);
        placeService.setReportRepo(repo);

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
                            case _ {
                                repo.create(req, caller._id, _chooseModerator());
                            };
                        };
                    };
                };
            };
        };

        private func _chooseModerator(
        ): Nat32 {
            switch(userRepo.findByRole(#moderator)) {
                case (#err(_)) {
                    1; // admin
                };
                case (#ok(moderators)) {
                    if(moderators.size() == 0) {
                        1 // admin;
                    }
                    else {
                        let index = Nat64.toNat(random.next() % Nat64.fromNat(moderators.size()));
                        moderators[index]._id;
                    }
                };
            };
        };

        public func update(
            id: Text, 
            req: Types.ReportRequest,
            invoker: Principal
        ): Result.Result<Types.Report, Text> {
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
            invoker: Principal
        ): async Result.Result<Types.Report, Text> {
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
                            if(e.state != Types.STATE_ASSIGNED) {
                                return #err("Invalid state");
                            };

                            if(e.assignedTo != caller._id) {
                                return #err("Forbidden");
                            };

                            let res = repo.close(e, req, caller._id);

                            if(req.result == Types.RESULT_SOLVED) {
                                switch(userService.findById(e.createdBy)) {
                                    case (#err(_)) {
                                    };
                                    case (#ok(reporter)) {
                                        ignore await daoService.rewardUser(
                                            reporter, 
                                            daoService.config.getAsNat64("REPORTER_REWARD")
                                        );

                                        ignore await daoService.rewardUser(
                                            caller, 
                                            daoService.config.getAsNat64("MODERATOR_REWARD")
                                        );
                                    };
                                };
                            };

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

            if(caller.banned) {
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
            }
            else if(UserUtils.isAdmin(caller)) {
                return true;
            };
                
            return false;
        };

        func _checkEntity(
            req: Types.ReportRequest
        ): Result.Result<(), Text> {
            if(req.entityType == Types.TYPE_CAMPAIGNS) {
                switch(campaignRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(req.entityType == Types.TYPE_USERS) {
                switch(userRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(req.entityType == Types.TYPE_SIGNATURES) {
                switch(signatureRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(req.entityType == Types.TYPE_VOTES) {
                switch(voteRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(req.entityType == Types.TYPE_FUNDINGS) {
                switch(fundingRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(req.entityType == Types.TYPE_DONATIONS) {
                switch(donationRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }            
            else if(req.entityType == Types.TYPE_UPDATES) {
                switch(updateRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else {
                switch(placeRepo.findById(req.entityId)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        #ok();
                    };
                };
            };
        };        
    };
};