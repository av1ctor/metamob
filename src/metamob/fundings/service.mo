import Utils "../common/utils";
import Account "../accounts/account";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import CampaignService "../campaigns/service";
import CampaignTypes "../campaigns/types";
import EntityTypes "../common/entities";
import Int "mo:base/Int";
import LedgerUtils "../common/ledger";
import ModerationTypes "../moderations/types";
import ModerationService "../moderations/service";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import PlaceService "../places/service";
import PlaceTypes "../places/types";
import Principal "mo:base/Principal";
import ReportRepository "../reports/repository";
import ReportTypes "../reports/types";
import Repository "./repository";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Types "./types";
import UserService "../users/service";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import NotificationService "../notifications/service";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        userService: UserService.Service,
        campaignService: CampaignService.Service,
        placeService: PlaceService.Service,
        moderationService: ModerationService.Service,
        reportRepo: ReportRepository.Repository,         
        notificationService: NotificationService.Service,
        ledgerUtils: LedgerUtils.LedgerUtils
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();
        let placeRepo = placeService.getRepository();

        campaignService.setFundingRepo(repo);

        public func create(
            req: Types.FundingRequest,
            invoker: Principal
        ): async Result.Result<Types.Funding, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(canChangeCampaign(
                                req.campaignId, [CampaignTypes.STATE_PUBLISHED, CampaignTypes.STATE_BUILDING])) {
                            case (#err(msg)) {
                                #err(msg);
                            };
                            case (#ok(campaign)) {
                                switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        switch(campaign.info) {
                                            case (#funding(info)) {
                                                if(Nat32.toNat(req.tier) >= info.tiers.size()) {
                                                    return #err("Invalid tier");
                                                };
                                                
                                                if(req.amount == 0) {
                                                    return #err("Invalid amount");
                                                };

                                                let tier = info.tiers[Nat32.toNat(req.tier)];
                                                if(tier.total + req.amount > tier.max) {
                                                    return #err("Not enough left on the selected tier");
                                                };

                                                if(req.value != tier.value * Nat32.toNat(req.amount)) {
                                                    return #err("Incorrect value");
                                                };
                                            };
                                            case _ {
                                                return #err("Invalid campaign kind");
                                            };
                                        };

                                        repo.create(req, Types.STATE_CREATED, caller._id);
                                    };
                                };
                            };
                        };           

                    };
                };
            };
        };

        public func complete(
            id: Text, 
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Types.Funding, Text> {
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

                                switch(canChangeCampaign(
                                        entity.campaignId, [CampaignTypes.STATE_PUBLISHED, CampaignTypes.STATE_BUILDING])) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        if(entity.state != Types.STATE_CREATED) {
                                            return #err("Invalid funding state");
                                        };

                                        let value = Nat64.fromNat(entity.value);
                                        let balance = await ledgerUtils.getUserBalance(invoker, this);
                                        if(balance < value + Nat64.fromNat(LedgerUtils.icp_fee)) {
                                            return #err("Insufficient balance");
                                        };
                                        
                                        switch(await ledgerUtils
                                            .transferFromUserSubaccountToCampaignSubaccountEx(
                                                campaign, caller._id, value, invoker, this)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case (#ok(amount)) {
                                                let res = repo.complete(entity, Nat64.toNat(amount), caller._id);
                                                if(campaign.goal != 0) {
                                                    switch(campaignRepo.findById(campaign._id)) {
                                                        case (#ok(campaign)) {
                                                            if(campaign.total >= campaign.goal) {
                                                                switch(await campaignService.startBuildingAndRunAction(
                                                                    campaign, caller, this)) {
                                                                    case (#err(msg)) {
                                                                        return #err(msg);
                                                                    };
                                                                    case _ {
                                                                    };
                                                                };
                                                            };
                                                        };
                                                        case _ {
                                                        };
                                                    };
                                                };

                                                ignore notificationService.create({
                                                   title = "Fundraising received";
                                                   body = "Your Campaign [" # campaign.pubId # "](/#/c/" # campaign.pubId # ") received a fundraising amounting **" # Utils.e8sToDecimal(value) # "** ICP!";
                                                }, campaign.createdBy);

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
            req: Types.FundingRequest,
            invoker: Principal
        ): async Result.Result<Types.Funding, Text> {
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

                                switch(canChangeCampaign(
                                        entity.campaignId, [CampaignTypes.STATE_PUBLISHED, CampaignTypes.STATE_BUILDING])) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                if(req.value != entity.value) {
                                                    return #err("Invalid field: value");
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

        public func moderate(
            id: Text, 
            req: Types.FundingRequest,
            mod: ModerationTypes.ModerationRequest,
            invoker: Principal
        ): Result.Result<Types.Funding, Text> {
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
                                        if(req.value != entity.value) {
                                            return #err("Invalid field: value");
                                        };
                                        
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
                                
                                switch(canChangeCampaign(
                                        entity.campaignId, [CampaignTypes.STATE_PUBLISHED])) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                if(entity.state == Types.STATE_COMPLETED) {
                                                    let amount = Nat64.fromNat(entity.value - (LedgerUtils.icp_fee * 2));
                                                    switch(repo.delete(entity, caller._id)) {
                                                        case (#err(msg)) {
                                                            #err(msg);
                                                        };
                                                        case _ {
                                                            let to = Account.accountIdentifier(
                                                                invoker, 
                                                                Account.defaultSubaccount()
                                                            );

                                                            let app = Account.accountIdentifier(
                                                                Principal.fromActor(this), 
                                                                Account.defaultSubaccount()
                                                            );

                                                            switch(
                                                                await ledgerUtils
                                                                    .withdrawFromCampaignSubaccountLessTax(
                                                                        campaign, amount, CampaignTypes.REFUND_TAX, to, app, caller._id)) {
                                                                case (#err(msg)) {
                                                                    ignore repo.insert(entity);
                                                                    #err(msg);
                                                                };
                                                                case _ {
                                                                    #ok();
                                                                };
                                                            };
                                                        };
                                                    };
                                                }
                                                else {
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
        };

        public func findById(
            _id: Nat32, 
            invoker: Principal
        ): Result.Result<Types.Funding, Text> {
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
        ): Result.Result<Types.Funding, Text> {
            repo.findByPubId(pubId);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Funding], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Funding], Text> {
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
        ): Result.Result<[Types.Funding], Text> {
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
        ): Result.Result<Types.Funding, Text> {
            repo.findByCampaignAndUser(campaignId, userId);
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
            entity: Types.Funding
        ): Bool {
            if(caller._id != entity.createdBy) {
                return false;
            };

            return true;
        };

        func canModerate(
            caller: UserTypes.Profile,
            entity: Types.Funding,
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
                        caller, EntityTypes.TYPE_FUNDINGS, entity._id, report)) {
                        return null;
                    };

                    return ?report;
                };
            };
        };

        func canChangeCampaign(
            campaignId: Nat32,
            states: [CampaignTypes.CampaignState]
        ): Result.Result<CampaignTypes.Campaign, Text> {
            switch(campaignRepo.findById(campaignId)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(campaign)) {
                    if(Option.isNull(
                        Array.find(
                            states, 
                            func(s: CampaignTypes.CampaignState): Bool = s == campaign.state
                        )
                    )) {
                        #err("Invalid campaign state");
                    }
                    else {
                        if(campaign.kind != CampaignTypes.KIND_FUNDING) {
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