import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Types "./types";
import Repository "./repository";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import UserService "../users/service";
import CampaignTypes "../campaigns/types";
import CampaignService "../campaigns/service";

module {
    public class Service(
        userService: UserService.Service,
        campaignService: CampaignService.Service
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();

        public func create(
            req: Types.UpdateRequest,
            invoker: Principal
        ): Result.Result<Types.Update, Text> {
            let caller = userService.findByPrincipal(invoker);
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(campaignRepo.findById(req.campaignId)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(campaign)) {
                                if(not canCreate(caller, campaign)) {
                                    return #err("Forbidden");
                                };

                                switch(canChangeCampaign(campaign)) {
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
            invoker: Principal
        ): Result.Result<Types.Update, Text> {
            let caller = userService.findByPrincipal(invoker);
            switch(caller) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(campaignRepo.findById(req.campaignId)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(campaign)) {
                                if(not canCreate(caller, campaign)) {
                                    return #err("Forbidden");
                                };

                                switch(canChangeCampaign(campaign)) {
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
                                                ignore campaignRepo.finish(campaign, result, caller._id);
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

        public func update(
            id: Text, 
            req: Types.UpdateRequest,
            invoker: Principal
        ): Result.Result<Types.Update, Text> {
            let caller = userService.findByPrincipal(invoker);
            switch(caller) {
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

                                switch(campaignRepo.findById(entity.campaignId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        switch(canChangeCampaign(campaign)) {
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
            id: Text
        ): Result.Result<Types.Update, Text> {
            repo.findByPubId(id);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Update], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?(Text, Text),
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
            userId: /* Text */ Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Update], Text> {
            repo.findByUser(userId, sortBy, limit);
        };

        public func delete(
            id: Text,
            invoker: Principal
        ): Result.Result<(), Text> {
            let caller = userService.findByPrincipal(invoker);
            switch(caller) {
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
                                
                                switch(campaignRepo.findById(entity.campaignId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        switch(canChangeCampaign(campaign)) {
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

        func canCreate(
            caller: UserTypes.Profile,
            entity: CampaignTypes.Campaign
        ): Bool {
            if(caller._id == entity.createdBy) {
                return true;
            }
            else if(UserUtils.isAdmin(caller)) {
                return true;
            };
                
            return false;
        };

        func canChange(
            caller: UserTypes.Profile,
            entity: Types.Update
        ): Bool {
            if(caller._id == entity.createdBy) {
                return true;
            }
            else if(UserUtils.isAdmin(caller)) {
                return true;
            };
                
            return false;
        };

        func canChangeCampaign(
            entity: CampaignTypes.Campaign
        ): Result.Result<(), Text> {
            if(entity.state != CampaignTypes.STATE_PUBLISHED) {
                #err("Invalid campaign state");
            }
            else {
                #ok();
            };
        };
    };
};