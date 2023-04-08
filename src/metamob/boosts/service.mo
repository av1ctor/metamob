import Utils "../common/utils";
import Account "../accounts/account";
import Blob "mo:base/Blob";
import CampaignService "../campaigns/service";
import CampaignTypes "../campaigns/types";
import EntityTypes "../common/entities";
import Int "mo:base/Int";
import PaymentTypes "../payments/types";
import PaymentService "../payments/service";
import LedgerHelper "../common/ledger";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
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
import Logger "../../logger/main";
import Variant "mo:mo-table/variant";
import D "mo:base/Debug";

module {
    public class Service(
        userService: UserService.Service,
        campaignService: CampaignService.Service,
        placeService: PlaceService.Service,
        reportRepo: ReportRepository.Repository,         
        notificationService: NotificationService.Service,
        paymentService: PaymentService.Service,
        ledgerHelper: LedgerHelper.LedgerHelper, 
        logger: Logger.Logger
    ) {
        let repo = Repository.Repository(campaignService.getRepository());
        let campaignRepo = campaignService.getRepository();
        let placeRepo = placeService.getRepository();

        public func create(
            req: Types.BoostRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Boost, Text> {
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
                                switch(await* placeService.checkAccess(caller, campaign.placeId, PlaceTypes.ACCESS_TYPE_COOPERATE)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        switch(repo.create(req, Types.STATE_CREATED, caller._id)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case (#ok(e)) {
                                                if(e.currency == PaymentTypes.CURRENCY_BTC) {
                                                    ignore await* paymentService.addPendingBtcDeposit(
                                                        "boost-" # e.pubId,
                                                        await* paymentService.getBtcAddressOfCampaignAndUserEx(campaign._id, caller._id),
                                                        Nat64.fromNat(e.value),
                                                        "boostOnBtcDepositConfirmed",
                                                        [{key = "id"; value = #nat32(e._id);}],
                                                        this
                                                    );
                                                };
                                                #ok(e);
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

        public func complete(
            id: Text, 
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Boost, Text> {
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
                                            return #err("Invalid boost state");
                                        };

                                        let value = Nat64.fromNat(entity.value);
                                        let balance = await* ledgerHelper.getUserBalance(invoker, this);
                                        if(balance < value + Nat64.fromNat(LedgerHelper.icp_fee)) {
                                            return #err("Insufficient balance");
                                        };
                                        
                                        switch(await* ledgerHelper
                                            .transferFromUserSubaccountToCampaignSubaccountEx(
                                                campaign, caller._id, value, invoker, this)) {
                                            case (#err(msg)) {
                                                return #err(msg);
                                            };
                                            case (#ok(amount)) {
                                                await* _complete(entity, campaign, caller, this);
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

        func _calcValueInIcp(
            entity: Types.Boost
        ): Nat {
            paymentService.calcValueInIcp(entity.currency, entity.value);
        };

        public func onBtcDepositConfirmed(
            params: [Variant.MapEntry],
            btcWalletCanisterId: Text,
            invoker: Principal,
            this: actor {}
        ): async* () {
            if(Principal.toText(invoker) != btcWalletCanisterId) {
                return;
            };

            let id = Variant.getNat32(params[0].value);
            switch(repo.findById(id)) {
                case (#err(msg)) {
                    return;
                };
                case (#ok(entity)) {
                    switch(canChangeCampaign(entity.campaignId)) {
                        case (#err(msg)) {
                            return;
                        };
                        case (#ok(campaign)) {
                            if(entity.state != Types.STATE_CREATED) {
                                return;
                            };

                            switch(userService.findById(entity.createdBy)) {
                                case (#err(msg)) {
                                    return;
                                };
                                case (#ok(caller)) {
                                    ignore await* _complete(entity, campaign, caller, this);
                                    return;
                                };
                            };
                        };
                    };
                };
            };
        };

        func _complete(
            entity: Types.Boost,
            campaign: CampaignTypes.Campaign,
            caller: UserTypes.Profile,
            this: actor {}
        ): async* Result.Result<Types.Boost, Text> {
            switch(repo.complete(entity, _calcValueInIcp(entity), caller._id)) {
                case(#ok(e)) {
                    let value = Nat64.fromNat(entity.value);
                    let currency = PaymentService.currencyToString(entity.currency);

                    ignore notificationService.create({
                        title = "Boost received";
                        body = "Your Campaign [" # campaign.pubId # "](/#/c/" # campaign.pubId # ") received a boost amounting **" # Utils.e8sToDecimal(value) # "** " # currency;
                    }, campaign.createdBy);

                    ignore logger.info(this, "Campaign " # campaign.pubId # " received a boost amounting " #  Utils.e8sToDecimal(value) # " " # currency # " by " # caller.pubId);
                    #ok(e);
                };
                case (#err(msg)) {
                    #err(msg);
                };
            };
        };

        public func update(
            id: Text, 
            req: Types.BoostRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Boost, Text> {
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
                                        switch(await* placeService.checkAccess(caller, campaign.placeId, PlaceTypes.ACCESS_TYPE_COOPERATE)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                if(req.value != entity.value) {
                                                    return #err("Invalid field: value");
                                                };
                                                
                                                ignore logger.info(this, "Boost " # entity.pubId # " was updated by " # caller.pubId);
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
        ): Result.Result<Types.Boost, Text> {
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
        ): Result.Result<Types.Boost, Text> {
            repo.findByPubId(pubId);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Boost], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Boost], Text> {
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
        ): Result.Result<[Types.Boost], Text> {
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
        ): Result.Result<Types.Boost, Text> {
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

            if((caller.banned & UserTypes.BANNED_AS_USER) > 0) {
                return false;
            };

            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            entity: Types.Boost
        ): Bool {
            if(caller._id != entity.createdBy) {
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
                        #ok(campaign);
                    };
                };
            };
        };
    };
};