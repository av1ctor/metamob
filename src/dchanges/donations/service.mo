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
import Account "../accounts/Account";
import Ledger "canister:ledger";

module {
    let icp_fee: Nat = 10_000;

    public class Service(
        userService: UserService.Service,
        campaignService: CampaignService.Service
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();

        public func create(
            req: Types.DonationRequest,
            invoker: Principal,
            this: actor {}
        ): Result.Result<Types.Donation, Text> {
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
                            case _ {
                                repo.create(req, Types.STATE_CREATED, caller._id);
                            };
                        };           

                    };
                };
            };
        };

        private func _transferFromUserSubaccountToCampaignSubaccount(
            campaign: CampaignTypes.Campaign,
            caller: UserTypes.Profile,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Nat64, Text> {
            let userAccountId = userService.getAccountId(invoker, this);
            let balance = await Ledger.account_balance({ account = userAccountId });
            let amount = balance.e8s;
            
            let receipt = await Ledger.transfer({
                memo: Nat64 = Nat64.fromNat(Nat32.toNat(caller._id));
                from_subaccount = ?Account.principalToSubaccount(invoker);
                to = Account.accountIdentifier(Principal.fromActor(this), Account.textToSubaccount(campaign.pubId));
                amount = { e8s = amount - Nat64.fromNat(icp_fee) };
                fee = { e8s = Nat64.fromNat(icp_fee) };
                created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
            });

            switch (receipt) {
                case (#Err _) {
                    #err("Transfer failed");
                };
                case _ {
                    #ok(amount);
                };
            };
        };

        public func complete(
            id: Text, 
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Types.Donation, Text> {
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

                                switch(campaignRepo.findById(entity.campaignId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        switch(canChangeCampaignEx(campaign)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                if(entity.state != Types.STATE_CREATED) {
                                                    return #err("Invalid donation state");
                                                };

                                                switch(await _transferFromUserSubaccountToCampaignSubaccount(campaign, caller, invoker, this)) {
                                                    case (#err(msg)) {
                                                        #err(msg);
                                                    };
                                                    case (#ok(amount)) {
                                                        repo.complete(entity, Nat64.toNat(amount), caller._id);
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
            req: Types.DonationRequest,
            invoker: Principal
        ): Result.Result<Types.Donation, Text> {
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

        public func findById(
            _id: Nat32, 
            invoker: Principal
        ): Result.Result<Types.Donation, Text> {
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
        ): Result.Result<Types.Donation, Text> {
            repo.findByPubId(pubId);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Donation], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?(Text, Text),
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Donation], Text> {
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
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Donation], Text> {
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
        ): Result.Result<Types.Donation, Text> {
            repo.findByCampaignAndUser(campaignId, userId);
        };

        private func _transferFromCampaignSubaccountToUserAccount(
            campaign: CampaignTypes.Campaign,
            amount: Nat,
            caller: UserTypes.Profile,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<(), Text> {
            
            let receipt = await Ledger.transfer({
                memo: Nat64 = Nat64.fromNat(Nat32.toNat(caller._id));
                from_subaccount = ?Account.textToSubaccount(campaign.pubId);
                to = Account.accountIdentifier(invoker, Account.defaultSubaccount());
                amount = { e8s = Nat64.fromNat(amount) - Nat64.fromNat(icp_fee) };
                fee = { e8s = Nat64.fromNat(icp_fee) };
                created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
            });

            switch (receipt) {
                case (#Err _) {
                    #err("Transfer failed");
                };
                case _ {
                    #ok();
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
                                
                                switch(campaignRepo.findById(entity.campaignId)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        switch(canChangeCampaignEx(campaign)) {
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
                                                                await _transferFromCampaignSubaccountToUserAccount(
                                                                    campaign, amount - icp_fee, caller, invoker, this)) {
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

            if(UserUtils.isAdmin(caller)) {
                return true;
            };
            
            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            entity: Types.Donation
        ): Bool {
            if(caller._id != entity.createdBy) {
                return false;
            };

            return true;
        };

        func canChangeCampaignEx(
            campaign: CampaignTypes.Campaign
        ): Result.Result<(), Text> {
            if(campaign.state != CampaignTypes.STATE_PUBLISHED) {
                #err("Invalid campaign state");
            }
            else {
                if(campaign.kind != CampaignTypes.KIND_DONATIONS) {
                    #err("Invalid campaign kind");
                }
                else {
                    #ok();
                };
            };
        };

        func canChangeCampaign(
            campaignId: Nat32
        ): Result.Result<(), Text> {
            switch(campaignRepo.findById(campaignId)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(campaign)) {
                    canChangeCampaignEx(campaign);
                };
            };
        };
    };
};