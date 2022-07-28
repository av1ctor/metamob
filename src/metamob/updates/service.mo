import CampaignService "../campaigns/service";
import CampaignTypes "../campaigns/types";
import EntityTypes "../common/entities";
import ModerationTypes "../moderations/types";
import ModerationService "../moderations/service";
import Nat32 "mo:base/Nat32";
import PlaceService "../places/service";
import PlaceTypes "../places/types";
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
        campaignService: CampaignService.Service,
        placeService: PlaceService.Service,
        moderationService: ModerationService.Service,
        reportRepo: ReportRepository.Repository
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();
        let placeRepo = placeService.getRepository();

        public func create(
            req: Types.UpdateRequest,
            invoker: Principal
        ): async Result.Result<Types.Update, Text> {
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
                                return #err(msg);
                            };
                            case (#ok(campaign)) {
                                if(not canCreate(caller, campaign)) {
                                    return #err("Forbidden");
                                };

                                switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        repo.create(req, caller._id);
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        public func createAndFinishCampaign(
            req: Types.UpdateRequest,
            result: CampaignTypes.CampaignResult,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Types.Update, Text> {
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
                                return #err(msg);
                            };
                            case (#ok(campaign)) {
                                if(not canCreate(caller, campaign)) {
                                    return #err("Forbidden");
                                };

                                switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        let res = repo.create(req, caller._id);
                                        switch(res) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case (#ok(upd)) {
                                                switch(await campaignService.finish(campaign, result, caller, this)) {
                                                    case (#err(msg)) {
                                                        #err(msg);
                                                    };
                                                    case _ {
                                                        #ok(upd);
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
            };
        };        

        public func update(
            id: Text, 
            req: Types.UpdateRequest,
            invoker: Principal
        ): async Result.Result<Types.Update, Text> {
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

        public func moderate(
            id: Text, 
            req: Types.UpdateRequest,
            mod: ModerationTypes.ModerationRequest,
            invoker: Principal
        ): Result.Result<Types.Update, Text> {
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

        public func findById(
            _id: Nat32, 
            invoker: Principal
        ): Result.Result<Types.Update, Text> {
            if(Principal.isAnonymous(invoker)) {
                return #err("Forbidden: anonymous user");
            };

            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not caller.active or caller.banned == UserTypes.BANNED_AS_USER) {
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
        ): Result.Result<Types.Update, Text> {
            repo.findByPubId(pubId);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Update], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Update], Text> {
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
        ): Result.Result<[Types.Update], Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    };

                    repo.findByUser(caller._id, sortBy, limit);
                };
            };
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

            if(caller.banned == UserTypes.BANNED_AS_USER) {
                return false;
            };

            return true;
        };

        func canCreate(
            caller: UserTypes.Profile,
            campaign: CampaignTypes.Campaign
        ): Bool {
            if(caller._id != campaign.createdBy) {
                if(not UserUtils.isModerator(caller)) {
                    return false;
                };
            };
                
            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            entity: Types.Update
        ): Bool {
            if(caller._id != entity.createdBy) {
                return false;
            };
                
            return true;
        };

        func canModerate(
            caller: UserTypes.Profile,
            entity: Types.Update,
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
                        caller, EntityTypes.TYPE_UPDATES, entity._id, report)) {
                        return null;
                    };

                    return ?report;
                };
            };
        };

        func canChangeCampaign(
            campaignId: Nat32
        ): Result.Result<CampaignTypes.Campaign, Text> {
            switch(campaignRepo.findById(campaignId)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(campaign)) {
                    if(campaign.state == CampaignTypes.STATE_CANCELED or
                        campaign.state == CampaignTypes.STATE_DELETED) {
                        #err("Invalid campaign state");
                    }
                    else {
                        #ok(campaign);
                    };
                };
            };
        };
    };
};