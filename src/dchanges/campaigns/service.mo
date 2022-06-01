import Array "mo:base/Array";
import CampaignTypes "types";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import Repository "./repository";
import Types "./types";
import UserService "../users/service";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import PlaceService "../places/service";
import PlaceTypes "../places/types";
import LedgerUtils "../utils/ledger";
import Account "../accounts/account";

module {
    public class Service(
        userService: UserService.Service,
        placeService: PlaceService.Service
    ) {
        let repo = Repository.Repository();
        let placeRepo = placeService.getRepository();
        
        public func create(
            req: Types.CampaignRequest,
            invoker: Principal
        ): async Result.Result<Types.Campaign, Text> {
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
                        
                        switch(await placeService.checkAccess(caller, req.placeId)) {
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

        public func update(
            id: Text, 
            req: Types.CampaignRequest,
            invoker: Principal
        ): async Result.Result<Types.Campaign, Text> {
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
                                if(not canChange(
                                    caller, 
                                    campaign, 
                                    [
                                        CampaignTypes.STATE_CREATED, 
                                        CampaignTypes.STATE_PUBLISHED
                                ])) {
                                    return #err("Forbidden");
                                };

                                if(Option.isSome(req.state)) {
                                    if(not UserUtils.isModerator(caller)) {
                                        return #err("Invalid field: state");
                                    };
                                };

                                if(req.kind != campaign.kind) {
                                    return #err("Kind can not be changed");
                                };

                                switch(await placeService.checkAccess(caller, req.placeId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        return repo.update(campaign, req, caller._id);
                                    };
                                };
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
                                if(not canChange(caller, campaign, [Types.STATE_CREATED])) {
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
        ): async Result.Result<Types.Campaign, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        #err("Forbidden");
                    }
                    else {
                        switch(repo.findById(_id)) {
                            case (#err(msg)) {
                                #err(msg);
                            };
                            case (#ok(campaign)) {
                                if(not canChange(caller, campaign, [Types.STATE_PUBLISHED])) {
                                    return #err("Forbidden");
                                };

                                switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        repo.finish(campaign, result, caller._id);
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        public func boost(
            pubId: Text, 
            value: Nat64,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Types.Campaign, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    switch(repo.findByPubId(pubId)) {
                        case (#err(msg)) {
                            #err(msg);
                        };
                        case (#ok(campaign)) {
                            let balance = await LedgerUtils.getUserBalance(invoker, this);
                            if(balance < value) {
                                return #err("Insufficient funds");
                            };
                            
                            switch(await LedgerUtils
                                .transferFromUserSubaccountToCampaignSubaccountEx(
                                    campaign, caller, value, invoker, this)) {
                                case (#err(msg)) {
                                    #err(msg);
                                };
                                case (#ok(_)) {
                                    repo.boost(campaign, Nat64.toNat(value));
                                };
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
                            case (#ok(campaign)) {
                                if(not canChange(caller, campaign, [Types.STATE_CREATED])) {
                                    return #err("Forbidden");
                                };

                                switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        repo.delete(campaign, caller._id);
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        public func getBalance(
            _id: Nat32,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Nat64, Text> {
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
                                if(not canChange(caller, campaign, [Types.STATE_FINISHED])) {
                                    return #err("Forbidden");
                                };

                                if(campaign.kind != Types.KIND_DONATIONS) {
                                    return #err("Wrong campaign kind");
                                };

                                #ok(await LedgerUtils.getCampaignBalance(campaign, this));
                            };
                        };
                    };
                };
            };
        };

        public func withdraw(
            _id: Nat32,
            to: Text,
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
                        switch(repo.findById(_id)) {
                            case (#err(msg)) {
                                return #err(msg);
                            };
                            case (#ok(campaign)) {
                                if(not canChange(caller, campaign, [Types.STATE_FINISHED])) {
                                    return #err("Forbidden");
                                };

                                if(campaign.kind != Types.KIND_DONATIONS) {
                                    return #err("Wrong campaign kind");
                                };

                                let balance = await LedgerUtils.getCampaignBalance(campaign, this);
                                if(balance <= Types.MIN_WITHDRAW_VALUE) {
                                    return #err("Nothing to withdraw");
                                };

                                let cut = (balance * (100 - Types.DONATIONS_TAX)) / 100;

                                let appAccountId = Account.accountIdentifier(
                                    Principal.fromActor(this), 
                                    Account.defaultSubaccount()
                                );

                                let toAccountId = Account.accountIdentifier(
                                    Principal.fromText(to), 
                                    Account.defaultSubaccount()
                                );

                                switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        switch(await LedgerUtils.withdrawFromCampaignSubaccount(
                                            campaign, 
                                            balance - cut, 
                                            toAccountId, 
                                            caller
                                        )) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                if(cut > 0) {
                                                    await LedgerUtils.withdrawFromCampaignSubaccount(
                                                        campaign, 
                                                        cut, 
                                                        appAccountId, 
                                                        caller
                                                    );
                                                }
                                                else {
                                                    #ok();
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

            if(UserUtils.isAdmin(caller)) {
                return true;
            };
            
            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            campaign: Types.Campaign,
            states: [Types.CampaignState]
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

            // any valid state?
            for(state in states.vals()) {
                if(campaign.state == state) {
                    return true;
                };                    
            };

            return false;
        };
    };
};
