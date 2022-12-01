import CampaignService "../campaigns/service";
import CampaignTypes "../campaigns/types";
import DIP20 "../common/dip20";
import DIP721 "../common/dip721";
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
import Logger "../../logger/main";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        userService: UserService.Service,
        campaignService: CampaignService.Service,
        placeService: PlaceService.Service,
        moderationService: ModerationService.Service,
        reportRepo: ReportRepository.Repository, 
        logger: Logger.Logger
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();
        let placeRepo = placeService.getRepository();

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
                                switch(await placeService.checkAccess(caller, campaign.placeId, PlaceTypes.ACCESS_TYPE_COOPERATE)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(place)) {
                                        switch(repo.findByCampaignAndUserEx(req.campaignId, caller._id, false)) {
                                            case (#ok(response)) {
                                                #err("Duplicated");
                                            };
                                            case _ {
                                                let weight = await _getWeight(place, invoker);
                                                let res = repo.create(req, weight, caller._id);
                                                switch(await _checkIfFinished(campaign, place, req.pro, caller, this)) {
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

        func _getWeight(
            place: PlaceTypes.Place,
            invoker: Principal
        ): async Nat {
            switch(place.auth) {
                case (#dip20(dip)) {
                    await DIP20.balanceOf(dip.canisterId, invoker);
                };
                case (#dip721(dip)) {
                    await DIP721.balanceOf(dip.canisterId, invoker);
                };
                case _ {
                    1;
                };
            };
        };

        public func update(
            id: Text, 
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
                                        switch(await placeService.checkAccess(caller, campaign.placeId, PlaceTypes.ACCESS_TYPE_COOPERATE)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                if(req.pro != entity.pro) {
                                                    return #err("Can't change type. Delete this vote and cast a new one");
                                                };
                                                ignore logger.info(this, "Vote " # entity.pubId # " was updated by " # caller.pubId);
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
            req: Types.VoteRequest,
            mod: ModerationTypes.ModerationRequest,
            invoker: Principal,
            this: actor {}
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
                                switch(canModerate(caller, entity, mod)) {
                                    case null {
                                        return #err("Forbidden");
                                    };
                                    case (?report) {
                                        if(req.pro != entity.pro) {
                                            return #err("Type can't be changed");
                                        };

                                        switch(moderationService.create(
                                            mod, report, Variant.hashMapToMap(Repository.serialize(entity, false)), caller)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case (#ok(moderation)) {
                                                ignore logger.info(this, "Vote " # entity.pubId # " was moderated by " # caller.pubId);
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

        func _checkIfFinished(
            campaign: CampaignTypes.Campaign,
            place: PlaceTypes.Place,
            pro: Bool,
            caller: UserTypes.Profile, 
            this: actor {}
        ): async Result.Result<(), Text> {
            if(campaign.goal != 0) {
                // reload because the campaign was updated
                switch(campaignRepo.findById(campaign._id)) {
                    case (#ok(campaign)) {
                        if(pro) {
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
                    if(not caller.active or ((caller.banned & UserTypes.BANNED_AS_USER) > 0)) {
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
            invoker: Principal,
            this: actor {}
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
                                        switch(await placeService.checkAccess(caller, campaign.placeId, PlaceTypes.ACCESS_TYPE_COOPERATE)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                ignore logger.info(this, "Vote " # entity.pubId # " was deleted by " # caller.pubId);
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

            if((caller.banned & UserTypes.BANNED_AS_USER) > 0) {
                return false;
            };

            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            entity: Types.Vote
        ): Bool {
            if(caller._id != entity.createdBy) {
                return false;
            };

            return true;
        };

        func canModerate(
            caller: UserTypes.Profile,
            entity: Types.Vote,
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
                        caller, EntityTypes.TYPE_VOTES, entity._id, report)) {
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