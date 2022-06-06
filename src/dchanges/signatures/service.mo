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
            req: Types.SignatureRequest,
            invoker: Principal
        ): async Result.Result<Types.Signature, Text> {
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
                                            case (#ok(_)) {
                                                #err("Duplicated");
                                            };
                                            case _ {
                                                let res = repo.create(req, caller._id);
                                                if(campaign.goal != 0 and campaign.total + 1 >= campaign.goal) {
                                                    ignore campaignRepo.finish(campaign, CampaignTypes.RESULT_WON, caller._id);
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
            req: Types.SignatureRequest,
            invoker: Principal
        ): async Result.Result<Types.Signature, Text> {
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
        ): Result.Result<Types.Signature, Text> {
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
        ): Result.Result<Types.Signature, Text> {
            repo.findByPubId(pubId);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Signature], Text> {
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
        ): Result.Result<[Types.Signature], Text> {
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
        ): Result.Result<Types.Signature, Text> {
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

            if(UserUtils.isAdmin(caller)) {
                return true;
            };
            
            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            entity: Types.Signature
        ): Bool {
            if(caller._id != entity.createdBy) {
                if(UserUtils.isAdmin(caller)) {
                    return true;
                };
                
                return false;
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
                        if(campaign.kind != CampaignTypes.KIND_SIGNATURES) {
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