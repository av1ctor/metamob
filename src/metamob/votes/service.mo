import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import UserService "../users/service";
import CampaignService "../campaigns/service";
import CampaignTypes "../campaigns/types";
import PlaceService "../places/service";
import PlaceTypes "../places/types";
import ReportRepository "../reports/repository";

module {
    public class Service(
        userService: UserService.Service,
        campaignService: CampaignService.Service,
        placeService: PlaceService.Service
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();
        let placeRepo = placeService.getRepository();
        var reportRepo: ?ReportRepository.Repository = null;

        public func setReportRepo(
            repo: ReportRepository.Repository
        ) {
            reportRepo := ?repo;
        };

        public func create(
            req: Types.VoteRequest,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Types.Vote, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(canChangeCampaign(req.campaignId)) {
                            case (#err(msg)) {
                                #err(msg);
                            };
                            case (#ok(campaign)) {
                                switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        switch(repo.findByCampaignAndUserEx(req.campaignId, caller._id, false)) {
                                            case (#ok(response)) {
                                                #err("Duplicated");
                                            };
                                            case _ {
                                                let res = repo.create(req, caller._id);
                                                switch(await _checkIfFinished(campaign, req, caller, this)) {
                                                    case (#err(msg)) {
                                                        return #err(msg);
                                                    };
                                                    case _ {
                                                    };
                                                };
                                                res;
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

        public func update(
            id: Text, 
            req: Types.VoteRequest,
            invoker: Principal
        ): async Result.Result<Types.Vote, Text> {
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
                            case (#ok(entity)) {
                                if(not canChange(caller, entity)) {
                                    return #err("Forbidden");
                                };

                                switch(canChangeCampaign(entity.campaignId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                if(req.pro != entity.pro) {
                                                    return #err("Can't change type. Delete this vote and cast a new one");
                                                };
                                                repo.update(entity, req, caller._id);
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

        func _checkIfFinished(
            campaign: CampaignTypes.Campaign,
            req: Types.VoteRequest,
            caller: UserTypes.Profile, 
            this: actor {}
        ): async Result.Result<(), Text> {
            if(campaign.goal != 0) {
                switch(campaignRepo.findById(campaign._id)) {
                    case (#ok(campaign)) {
                        if(req.pro) {
                            let votes = switch(campaign.info) {case (#votes(info)) info.pro; case _ 0;};
                            if(votes >= campaign.goal) {
                                switch(await campaignService.finishAndRunAction(
                                        campaign, CampaignTypes.RESULT_OK, caller, this)) {
                                    case (#err(msg)) {
                                        return #err(msg);
                                    };
                                    case _ {
                                    };
                                };
                            };
                        }
                        else {
                            let votes = switch(campaign.info) {case (#votes(info)) info.against; case _ 0;};
                            if(votes >= campaign.goal) {
                                switch(await campaignService.finishAndRunAction(
                                        campaign, CampaignTypes.RESULT_NOK, caller, this)) {
                                    case (#err(msg)) {
                                        return #err(msg);
                                    };
                                    case _ {
                                    };
                                };
                            };
                        };
                    };
                    case _ {
                    };
                };
            };

            #ok();
        };

        public func findById(
            _id: Nat32, 
            invoker: Principal
        ): Result.Result<Types.Vote, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };

            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned) {
                        return #err("Forbidden: not active");
                    };

                    if(not UserUtils.isModerator(caller)) {
                        return #err("Forbidden");
                    };

                    repo.findById(_id);
                };
            };
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Vote, Text> {
            repo.findByPubId(pubId);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Vote], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Vote], Text> {
            repo.findByCampaign(campaignId, sortBy, limit);
        };

        public func countByCampaign(
            campaignId: Nat32
        ): Result.Result<Nat, Text> {
            repo.countByCampaign(campaignId);
        };

        public func findByUser(
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Vote], Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    };

                    repo.findByUserEx(caller._id, sortBy, limit, false);
                };
            };
        };

        public func findByCampaignAndUser(
            campaignId: Nat32,
            userId: Nat32
        ): Result.Result<Types.Vote, Text> {
            repo.findByCampaignAndUser(campaignId, userId);
        };

        public func delete(
            id: Text,
            invoker: Principal
        ): async Result.Result<(), Text> {
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
                            case (#ok(entity)) {
                                if(not canChange(caller, entity)) {
                                    return #err("Forbidden");
                                };
                                
                                switch(canChangeCampaign(entity.campaignId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                repo.delete(entity, caller._id);
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
            entity: Types.Vote
        ): Bool {
            if(caller._id != entity.createdBy) {
                // not an admin?
                if(not UserUtils.isAdmin(caller)) {
                    // not a moderator?
                    if(not UserUtils.isModerator(caller)) {
                        return false;
                    };
                    
                    // if it's a moderator, there must exist an open report
                    if(not UserUtils.isModeratingOnEntity(caller, entity._id, reportRepo)) {
                        return false;
                    };
                };
            };

            return true;
        };

        func canChangeCampaign(
            campaignId: Nat32
        ): Result.Result<CampaignTypes.Campaign, Text> {
            switch(campaignRepo.findById(campaignId)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(campaign)) {
                    if(campaign.state != CampaignTypes.STATE_PUBLISHED) {
                        #err("Invalid campaign state");
                    }
                    else {
                        if(campaign.kind != CampaignTypes.KIND_VOTES and
                            campaign.kind != CampaignTypes.KIND_WEIGHTED_VOTES) {
                            #err("Invalid campaign kind");
                        }
                        else {
                            #ok(campaign);
                        };
                    };
                };
            };
        };
    };
};