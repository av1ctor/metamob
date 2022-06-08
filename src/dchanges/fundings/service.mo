import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Time "mo:base/Time";
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
import LedgerUtils "../utils/ledger";

module {
    public class Service(
        userService: UserService.Service,
        campaignService: CampaignService.Service,
        placeService: PlaceService.Service
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();
        let placeRepo = placeService.getRepository();

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

                                switch(canChangeCampaign(entity.campaignId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        if(entity.state != Types.STATE_CREATED) {
                                            return #err("Invalid funding state");
                                        };

                                        switch(await LedgerUtils
                                            .transferFromUserSubaccountToCampaignSubaccount(
                                                campaign, caller, invoker, this)) {
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
            userId: /* Text */ Nat32,
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

                    if(caller._id != userId) {
                        if(not UserUtils.isAdmin(caller)) {
                            return #err("Forbidden");
                        };
                    };            
                    
                    repo.findByUser(userId, sortBy, limit);
                };
            };
        };

        public func findByCampaignAndUser(
            campaignId: Nat32,
            userId: Nat32
        ): Result.Result<Types.Funding, Text> {
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
                                        switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                if(entity.state == Types.STATE_COMPLETED) {
                                                    let amount = entity.value;
                                                    switch(repo.delete(entity, caller._id)) {
                                                        case (#err(msg)) {
                                                            #err(msg);
                                                        };
                                                        case _ {
                                                            switch(
                                                                await LedgerUtils
                                                                    .transferFromCampaignSubaccountToUserAccount(
                                                                        campaign, amount - LedgerUtils.icp_fee, caller, invoker, this)) {
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
            entity: Types.Funding
        ): Bool {
            if(caller._id != entity.createdBy) {
                if(not UserUtils.isModerator(caller)) {
                    return false;
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
                    if(campaign.state != CampaignTypes.STATE_PUBLISHED and
                        campaign.state != CampaignTypes.STATE_BUILDING) {
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