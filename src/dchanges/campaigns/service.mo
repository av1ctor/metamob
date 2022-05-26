import Array "mo:base/Array";
import CampaignTypes "types";
import D "mo:base/Debug";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Repository "./repository";
import Result "mo:base/Result";
import Types "./types";
import UserService "../users/service";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        userService: UserService.Service
    ) {
        let repo = Repository.Repository();
        
        public func create(
            req: Types.CampaignRequest,
            invoker: Principal
        ): Result.Result<Types.Campaign, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        if(Option.isSome(req.state)) {
                            if(not UserUtils.isModerator(caller)) {
                                return #err("Invalid field: state");
                            };
                        };
                        repo.create(req, caller._id);
                    };
                };
            };
        };

        public func update(
            id: Text, 
            req: Types.CampaignRequest,
            invoker: Principal
        ): Result.Result<Types.Campaign, Text> {
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
                            case (#ok(campaign)) {
                                if(not canChange(caller, campaign)) {
                                    return #err("Forbidden");
                                };

                                if(Option.isSome(req.state)) {
                                    if(not UserUtils.isModerator(caller)) {
                                        return #err("Invalid field: state");
                                    };
                                };

                                if(req.kind != campaign.kind) {
                                    return #err("Kind can not be changed after the campaign is created");
                                };
                                
                                return repo.update(campaign, req, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func publish(
            pubId: Text, 
            invoker: Principal
        ): Result.Result<Types.Campaign, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        if(not UserUtils.isAdmin(caller)) {
                            return #err("Forbidden");
                        };
                        
                        switch(repo.findByPubId(pubId)) {
                            case (#err(msg)) {
                                #err(msg);
                            };
                            case (#ok(campaign)) {
                                if(not canChange(caller, campaign)) {
                                    return #err("Forbidden");
                                };
                                
                                repo.publish(campaign, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func finish(
            _id: Nat32, 
            result: Types.CampaignResult,
            invoker: Principal
        ): Result.Result<Types.Campaign, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    }
                    else {
                        switch(repo.findById(_id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(campaign)) {
                                if(not canChange(caller, campaign)) {
                                    return #err("Forbidden");
                                };
                                
                                return repo.finish(campaign, result, caller._id);
                            };
                        };
                    };
                };
            };
        };

        public func findById(
            _id: Nat32
        ): Result.Result<Types.Campaign, Text> {
            repo.findById(_id);
        };

        public func findByPubId(
            pubId: Text
        ): Result.Result<Types.Campaign, Text> {
            repo.findByPubId(pubId);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCategory(
            categoryId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {
            repo.findByCategory(categoryId, sortBy, limit);
        };

        public func findByPlace(
            placeId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {
            repo.findByPlace(placeId, sortBy, limit);
        };

        public func findByTag(
            tagId: Text,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {
            repo.findByTag(tagId, sortBy, limit);
        };

        public func findByUser(
            userId: /* Text */ Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Campaign], Text> {
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

        public func delete(
            id: Text,
            invoker: Principal
        ): Result.Result<(), Text> {
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
                            case (#ok(campaign)) {
                                if(not canChange(caller, campaign)) {
                                    return #err("Forbidden");
                                };

                                if(campaign.state != Types.STATE_CREATED) {
                                    return #err("Campaigns can not be deleted after published")
                                };
                                
                                repo.delete(campaign, caller._id);
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
            campaign: Types.Campaign
        ): Bool {
            // not the same author?
            if(caller._id != campaign.createdBy) {
                // not an admin?
                if(not UserUtils.isAdmin(caller)) {
                    return false;
                };
            };

            // deleted?
            if(Option.isSome(campaign.deletedAt)) {
                return false;
            };

            // not published or created?
            if(campaign.state != CampaignTypes.STATE_CREATED and 
                campaign.state != CampaignTypes.STATE_PUBLISHED) {
                return false;
            };

            return true;
        };
    };
};
