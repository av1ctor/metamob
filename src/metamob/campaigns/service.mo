import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Utils "../common/utils";
import Account "../accounts/account";
import Array "mo:base/Array";
import DIP20 "../common/dip20";
import DIP721 "../common/dip721";
import D "mo:base/Debug";
import EntityTypes "../common/entities";
import Error "mo:base/Error";
import IC "mo:base/ExperimentalInternetComputer";
import FundingRepository "../fundings/repository";
import BtcHelper "../common/btchelper";
import LedgerHelper "../common/ledger";
import ModerationTypes "../moderations/types";
import ModerationService "../moderations/service";
import Nat "mo:base/Nat";
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
import Types "./types";
import UserService "../users/service";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import NotificationService "../notifications/service";
import FileStoreHelper "../common/filestore";
import Logger "../../logger/main";
import Variant "mo:mo-table/variant";

module {
    public class Service(
        userService: UserService.Service,
        placeService: PlaceService.Service,
        moderationService: ModerationService.Service,
        reportRepo: ReportRepository.Repository,
        notificationService: NotificationService.Service, 
        ledgerHelper: LedgerHelper.LedgerHelper,
        btcHelper: BtcHelper.BtcHelper,
        fileStoreHelper: FileStoreHelper.FileStoreHelper,
        logger: Logger.Logger
    ) {
        let repo = Repository.Repository();
        let userRepo = userService.getRepository();
        let placeRepo = placeService.getRepository();
        var fundingRepo: ?FundingRepository.Repository = null;

        func _create(
            req: Types.CampaignRequest,
            invoker: Principal,
            this: actor {},
            cb: (
                req: Types.CampaignRequest, 
                caller: UserTypes.Profile
            ) -> async* Result.Result<Types.Campaign, Text>
        ): async* Result.Result<Types.Campaign, Text> {
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
                            return #err("Invalid field: state");
                        };
                        
                        switch(await* placeService.checkAccess(caller, req.placeId, PlaceTypes.ACCESS_TYPE_CREATE)) {
                            case (#err(msg)) {
                                #err(msg);
                            };
                            case (#ok(place)) {
                                switch(_validateInfo(req.kind, req.info)) {
                                    case (#err(msg)) {
                                        return #err(msg);
                                    };
                                    case _ {
                                    };
                                };

                                switch(req.action) {
                                    case (#invoke(action)) {
                                        if(req.kind != Types.KIND_VOTES and req.kind != Types.KIND_WEIGHTED_VOTES) {
                                            return #err("Wrong campaign kind");
                                        };

                                        if(action.canisterId.size() > 0) {
                                            if(action.method.size() == 0) {
                                                return #err("Method undefined");
                                            };
                                            if(action.args.size() == 0) {
                                                return #err("Arguments undefined");
                                            };
                                        };
                                    };
                                    case (#transfer(action)) {
                                        if(req.kind != Types.KIND_FUNDING and req.kind != Types.KIND_DONATIONS) {
                                            return #err("Wrong campaign kind");
                                        };

                                        if(action.receiver.size() == 0) {
                                            return #err("Receiver undefined");
                                        };
                                    };
                                    case(#nop) {
                                    };
                                };

                                let goal = await* _calcGoal(req, place);
                                
                                await* cb({req with goal = goal;}, caller);
                            };
                        };
                    };
                };
            };
        };

        func _calcGoal(
            req: Types.CampaignRequest,
            place: PlaceTypes.Place
        ): async* Nat {
            if(req.kind == Types.KIND_VOTES or req.kind == Types.KIND_WEIGHTED_VOTES) {
                switch(place.auth) {
                    case (#dip20(dip)) {
                        (await* DIP20.totalSupply(dip.canisterId)) / 2 + 1;
                    };
                    case (#dip721(dip)) {
                        (await* DIP721.totalSupply(dip.canisterId)) / 2 + 1;
                    };
                    case _ {
                        req.goal;
                    };
                };
            } 
            else {
                req.goal;
            };
        };

        public func create(
            req: Types.CampaignRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Campaign, Text> {
            await* _create(
                req,
                invoker,
                this,
                func(
                    req: Types.CampaignRequest, 
                    caller: UserTypes.Profile
                ): async* Result.Result<Types.Campaign, Text> {
                    switch(repo.create(req, caller._id)) {
                        case (#ok(e)) {
                            ignore logger.info(this, "Campaign " # e.pubId # " created by " # caller.pubId);
                            #ok(e);
                        };
                        case (#err(msg)) {
                            #err(msg);
                        };
                    };
                }
            );
        };

        public func createWithFile(
            req: Types.CampaignRequest,
            file: FileStoreHelper.FileRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Campaign, Text> {
            switch(fileStoreHelper.checkFileRequest(file)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                };
            };
            
            await* _create(
                req,
                invoker,
                this,
                func(
                    req: Types.CampaignRequest, 
                    caller: UserTypes.Profile
                ): async* Result.Result<Types.Campaign, Text> {
                    switch(await* fileStoreHelper.create(file)) {
                        case (#err(msg)) {
                            #err(msg);
                        };
                        case (#ok(fileId)) {
                            switch(repo.createWithCover(req, fileId, caller._id)) {
                                case (#ok(e)) {
                                    ignore logger.info(this, "Campaign " # e.pubId # " created by " # caller.pubId);
                                    #ok(e);
                                };
                                case (#err(msg)) {
                                    #err(msg);
                                };
                            };
                        };
                    };
                    
                }
            );
        };

        func _update(
            id: Text, 
            req: Types.CampaignRequest,
            invoker: Principal,
            this: actor {},
            cb: (
                campaign: Types.Campaign, 
                place: PlaceTypes.Place,
                req: Types.CampaignRequest, 
                caller: UserTypes.Profile
            ) -> async* Result.Result<Types.Campaign, Text>
        ): async* Result.Result<Types.Campaign, Text> {
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
                                        Types.STATE_CREATED, 
                                        Types.STATE_PUBLISHED
                                ])) {
                                    return #err("Forbidden");
                                };

                                if(Option.isSome(req.state)) {
                                    return #err("Invalid field: state");
                                };

                                if(req.kind != campaign.kind) {
                                    return #err("Kind can not be changed");
                                };

                                if(req.info != campaign.info) {
                                    if(campaign.total != 0) {
                                        return #err("Info can not be changed because campaign total is greater than 0");
                                    };
                                };

                                switch(_validateInfo(req.kind, req.info)) {
                                    case (#err(msg)) {
                                        return #err(msg);
                                    };
                                    case _ {
                                    };
                                };

                                switch(await* placeService.checkAccess(caller, req.placeId, PlaceTypes.ACCESS_TYPE_CREATE)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(place)) {
                                        await* cb(campaign, place, req, caller);
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };

        func _checkGoal(
            req: Types.CampaignRequest,
            campaign: Types.Campaign,
            place: PlaceTypes.Place,
            updated: Types.Campaign,
            caller: UserTypes.Profile,
            this: actor {}
        ): async* Result.Result<(), Text> {
            if(campaign.total >= req.goal) {
                if(updated.kind != Types.KIND_FUNDING) {
                    switch(await* finishAndRunAction(
                            updated, Types.RESULT_OK, caller, this)) {
                        case (#err(msg)) {
                            return #err(msg);
                        };
                        case _ {
                        };
                    };
                }
                else {
                    switch(await* startBuildingAndRunAction(updated, caller, this)) {
                        case (#err(msg)) {
                            return #err(msg);
                        };
                        case _ {
                        };
                    };
                };
            };

            #ok();
        };

        public func update(
            id: Text, 
            req: Types.CampaignRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Campaign, Text> {
            await* _update(
                id,
                req,
                invoker,
                this,
                func(
                    campaign: Types.Campaign,
                    place: PlaceTypes.Place,
                    req: Types.CampaignRequest, 
                    caller: UserTypes.Profile
                ): async* Result.Result<Types.Campaign, Text> {
                    switch(repo.update(campaign, req, caller._id)) {
                        case (#err(msg)) {
                            return #err(msg);
                        };
                        case(#ok(e)) {
                            if(campaign.goal != req.goal) {
                                if(req.goal > 0) {
                                    switch(await* _checkGoal(req, campaign, place, e, caller, this)) {
                                        case (#err(msg)) {
                                            return #err(msg);
                                        };
                                        case _ {
                                        };
                                    };
                                };
                            };

                            ignore logger.info(this, "Campaign " # campaign.pubId # " updated by " # caller.pubId);
                            #ok(e);
                        };
                    };                    
                }
            );
        };

        public func updateWithFile(
            id: Text, 
            req: Types.CampaignRequest,
            file: FileStoreHelper.FileRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Campaign, Text> {
            await* _update(
                id,
                req,
                invoker,
                this,
                func(
                    campaign: Types.Campaign,
                    place: PlaceTypes.Place,
                    req: Types.CampaignRequest, 
                    caller: UserTypes.Profile
                ): async* Result.Result<Types.Campaign, Text> {
                    switch(await* fileStoreHelper.create(file)) {
                        case (#err(msg)) {
                            #err(msg);
                        };
                        case (#ok(fileId)) {
                            switch(repo.updateWithCover(campaign, req, fileId, caller._id)) {
                                case (#err(msg)) {
                                    return #err(msg);
                                };
                                case(#ok(e)) {
                                    if(fileStoreHelper.isId(campaign.cover)) {
                                        ignore fileStoreHelper.delete(campaign.cover);
                                    };

                                    if(campaign.goal != req.goal) {
                                        if(req.goal > 0) {
                                            switch(await* _checkGoal(req, campaign, place, e, caller, this)) {
                                                case (#err(msg)) {
                                                    return #err(msg);
                                                };
                                                case _ {
                                                };
                                            };
                                        };
                                    };

                                    ignore logger.info(this, "Campaign " # campaign.pubId # " updated by " # caller.pubId);
                                    #ok(e);
                                };
                            };                    
                        };
                    };
                }
            );
        };

        func _moderate(
            id: Text, 
            req: Types.CampaignRequest,
            mod: ModerationTypes.ModerationRequest,
            invoker: Principal,
            this: actor {},
            cb: (campaign: Types.Campaign, req: Types.CampaignRequest, mod: ModerationTypes.Moderation, caller: UserTypes.Profile) -> async* Result.Result<Types.Campaign, Text>
        ): async* Result.Result<Types.Campaign, Text> {
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
                                switch(canModerate(caller, campaign, mod)) {
                                    case null {
                                        return #err("Forbidden");
                                    };

                                    case (?report) {
                                        if(req.kind != campaign.kind) {
                                            return #err("Kind can't be changed");
                                        };

                                        if(campaign.goal != req.goal) {
                                            return #err("Goal can't be changed");
                                        };

                                        switch(_validateInfo(req.kind, req.info)) {
                                            case (#err(msg)) {
                                                return #err(msg);
                                            };
                                            case _ {
                                            };
                                        };

                                        switch(moderationService.create(
                                            mod, report, Variant.hashMapToMap(Repository.serialize(campaign, false)), caller)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case (#ok(moderation)) {
                                                ignore logger.info(this, "Campaign " # campaign.pubId # " moderated by " # caller.pubId);
                                                await* cb(campaign, req, moderation, caller);
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
            req: Types.CampaignRequest,
            mod: ModerationTypes.ModerationRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Campaign, Text> {
            await* _moderate(
                id,
                req,
                mod,
                invoker,
                this,
                func(
                    campaign: Types.Campaign,
                    req: Types.CampaignRequest, 
                    mod: ModerationTypes.Moderation,
                    caller: UserTypes.Profile
                ): async* Result.Result<Types.Campaign, Text> {
                    repo.moderate(campaign, req, mod, caller._id);
                }
            );
        };

        public func moderateWithFile(
            id: Text, 
            req: Types.CampaignRequest,
            file: FileStoreHelper.FileRequest,
            mod: ModerationTypes.ModerationRequest,
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<Types.Campaign, Text> {
            await* _moderate(
                id,
                req,
                mod,
                invoker,
                this,
                func(
                    campaign: Types.Campaign,
                    req: Types.CampaignRequest, 
                    mod: ModerationTypes.Moderation,
                    caller: UserTypes.Profile
                ): async* Result.Result<Types.Campaign, Text> {
                    switch(await* fileStoreHelper.create(file)) {
                        case (#err(msg)) {
                            #err(msg);
                        };
                        case (#ok(fileId)) {
                            repo.moderateWithCover(campaign, req, fileId, mod, caller._id);
                        };
                    };
                }
            );
        };

        public func revertModeration(
            mod: ModerationTypes.Moderation
        ): async* Result.Result<(), Text> {
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
                            if(fileStoreHelper.isId(entity.cover)) {
                                ignore fileStoreHelper.delete(entity.cover);
                            };

                            #ok()
                        };
                    };
                };
            };
        };

        func _validateInfo(
            kind: Types.CampaignKind,
            info: Types.CampaignInfo
        ): Result.Result<(), Text> {
            switch(info) {
                case (#signatures(_)) {
                    if(kind != Types.KIND_SIGNATURES) {
                        return #err("Invalid field: info");
                    };
                };
                case (#donations(_)) {
                    if(kind != Types.KIND_DONATIONS) {
                        return #err("Invalid field: info");
                    };
                };
                case (#votes(_)) {
                    if(kind != Types.KIND_VOTES and kind != Types.KIND_WEIGHTED_VOTES) {
                        return #err("Invalid field: info");
                    };
                };
                case (#funding(info)) {
                    if(kind != Types.KIND_FUNDING) {
                        return #err("Invalid field: info");
                    };

                    if(info.tiers.size() == 0 or info.tiers.size() > 20) {
                        return #err("Invalid field: tiers[]");
                    };
                    for(tier in info.tiers.vals()) {
                        if(tier.title.size() == 0 or tier.title.size() > 256) {
                            return #err("Invalid field: tiers[].title");
                        };
                        if(tier.desc.size() == 0 or tier.desc.size() > 1024) {
                            return #err("Invalid field: tiers[].desc");
                        };
                        if(tier.total != 0) {
                            return #err("Invalid field: tiers[].total");
                        };
                        if(tier.max == 0) {
                            return #err("Invalid field: tiers[].max");
                        };
                        if(tier.value <= Nat64.toNat(Types.MIN_WITHDRAW_VALUE)) {
                            return #err("Invalid field: tiers[].value");
                        };
                    };
                };
            };

            return #ok();
        };

        func _transferFunds(
            campaign: Types.Campaign,
            action: Types.CampaignTransferFundsAction,
            caller: UserTypes.Profile,
            this: actor {}
        ): async* Result.Result<(), Text> {
            let balance = await* ledgerHelper.getCampaignBalance(campaign, this);
            if(balance <= Types.MIN_WITHDRAW_VALUE) {
                return #err("Nothing to withdraw");
            };

            let tax = 
                if(campaign.kind == Types.KIND_DONATIONS) 
                    Types.DONATIONS_TAX 
                else 
                    Types.FUNDING_TAX;

            let app = Account.accountIdentifier(
                Principal.fromActor(this), 
                Account.defaultSubaccount()
            );

            let to = Account.accountIdentifier(
                Principal.fromText(action.receiver), 
                Account.defaultSubaccount()
            );

            try {
                ignore await* ledgerHelper.withdrawFromCampaignSubaccountLessTax(
                    campaign, 
                    balance, 
                    tax,
                    to, 
                    app,
                    caller._id
                );
                ignore logger.info(this, "Transfered " # Nat64.toText(balance) # " ICP from Campaign " # campaign.pubId  # " to " # action.receiver);
                #ok();
            }
            catch(e) { 
                ignore logger.err(this, "Transfer of " # Nat64.toText(balance) # " ICP from Campaign " # campaign.pubId  # " to " # action.receiver # " failed: " # Error.message(e));
                #err(Error.message(e)) 
            };
        };

        func _invokeMethod(
            campaign: Types.Campaign,
            action: Types.CampaignInvokeMethodAction,
            caller: UserTypes.Profile,
            this: actor {}
        ): async* Result.Result<(), Text> {
            if(action.canisterId.size() == 0) {
                return #ok();
            };

            try {
                ignore await IC.call(
                    Principal.fromText(action.canisterId), 
                    action.method, 
                    to_candid(action.args)
                );
                ignore logger.info(this, "Method " # action.canisterId # "." # action.method # "(" # debug_show(action.args) # ") invoked by campaign " # campaign.pubId);
                #ok();
            }
            catch(e) { 
                ignore logger.err(this, "Method " # action.canisterId # "." # action.method # "() invocation failed: " # Error.message(e));
                #err(Error.message(e)) 
            };
        };

        func _runAction(
            campaign: Types.Campaign,
            caller: UserTypes.Profile,
            this: actor {}
        ): async* Result.Result<(), Text> {
            switch(campaign.action) {
                case (#transfer(action)) {
                    await* _transferFunds(campaign, action, caller, this);
                };
                case (#invoke(action)) {
                    await* _invokeMethod(campaign, action, caller, this);
                };
                case _ {
                    #ok();
                };
            };
        };

        public func finishAndRunAction(
            campaign: Types.Campaign, 
            result: Types.CampaignResult,
            caller: UserTypes.Profile,
            this: actor {}
        ): async* Result.Result<Types.Campaign, Text> {
            let res = repo.finish(campaign, result, caller._id);

            if(result == Types.RESULT_OK) {
                switch(await* _runAction(campaign, caller, this)) {
                    case (#err(msg)) {
                        return #err(msg);
                    };
                    case _ {
                    };
                };
            };

            res;
        };

        public func setFundingRepo(
            repo: FundingRepository.Repository
        ) {
            fundingRepo := ?repo;
        };

        func _refundFunders(
            campaign: Types.Campaign,
            this: actor {}
        ): async* () {
            let app = Account.accountIdentifier(
                Principal.fromActor(this), 
                Account.defaultSubaccount()
            );

            switch(fundingRepo) {
                case (?fundingRepo) {
                    label l loop {
                        switch(fundingRepo.findByCampaign(campaign._id, null, ?(0, 50))) {
                            case (#err(_)) {
                                break l;
                            };
                            case (#ok(entities)) {
                                if(entities.size() == 0) {
                                    break l;
                                };

                                for(e in entities.vals()) {
                                    try {
                                        let amount = Nat64.fromNat(e.value);
                                        ignore fundingRepo.deleteRaw(e);

                                        switch(userRepo.findById(e.createdBy)) {
                                            case (#ok(user)) {
                                                let to = Account.accountIdentifier(
                                                    Principal.fromText(user.principal), 
                                                    Account.defaultSubaccount()
                                                );

                                                switch(await* ledgerHelper.withdrawFromCampaignSubaccountLessTax(
                                                    campaign, amount, Types.REFUND_TAX, to, app, 1
                                                )) {
                                                    case (#err(msg)) {
                                                        ignore logger.err(this, "CampaignService.refundFunders(" # Nat32.toText(e._id) # "): " # msg);
                                                    };
                                                    case _ {
                                                    };
                                                };
                                            };
                                            case _ {
                                                ignore logger.err(this, "CampaignService.refundFunders(" # Nat32.toText(e._id) # "): user not found");
                                            };
                                        };
                                    }
                                    catch(error: Error) {
                                        ignore logger.err(this, "CampaignService.refundFunders(" # Nat32.toText(e._id) # "): " # Error.message(error));
                                    };
                                };
                            };
                        };
                    };
                };
                case null {
                };
            };
        };

        public func startBuildingAndRunAction(
            campaign: Types.Campaign, 
            caller: UserTypes.Profile,
            this: actor {}
        ): async* Result.Result<Types.Campaign, Text> {
            let res = repo.startBuilding(campaign, caller._id);

            switch(await* _runAction(campaign, caller, this)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case _ {
                };
            };

            res;
        };

        public func finish(
            campaign: Types.Campaign, 
            result: Types.CampaignResult,
            caller: UserTypes.Profile,
            this: actor {}
        ): async* Result.Result<Types.Campaign, Text> {
            if(not hasAuth(caller)) {
                #err("Forbidden");
            }
            else {
                if(not canChange(caller, campaign, [Types.STATE_PUBLISHED, Types.STATE_BUILDING])) {
                    return #err("Forbidden");
                };

                switch(await* placeService.checkAccess(caller, campaign.placeId, PlaceTypes.ACCESS_TYPE_CREATE)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case _ {
                        if(campaign.state != Types.STATE_BUILDING) {
                            if(result == Types.RESULT_OK and campaign.goal != 0) {
                                return #err("Result will be automatically set when the goal is reached");
                            };
                            await* finishAndRunAction(campaign, result, caller, this);
                        }
                        else {
                            repo.finish(campaign, result, caller._id);
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
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCategory(
            categoryId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {
            repo.findByCategory(categoryId, sortBy, limit);
        };

        public func findByPlace(
            placeId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {
            repo.findByPlace(placeId, sortBy, limit);
        };

        public func findByTag(
            tagId: Text,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Campaign], Text> {
            repo.findByTag(tagId, sortBy, limit);
        };

        public func findByUser(
            userId: /* Text */ Nat32,
            sortBy: ?[(Text, Text)],
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
            invoker: Principal,
            this: actor {}
        ): async* Result.Result<(), Text> {
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
                                    if(campaign.state != Types.STATE_PUBLISHED or campaign.interactions > 0 or campaign.total > 0 or campaign.boosting > 0) {
                                        return #err("Invalid campaign state");
                                    };
                                };

                                switch(await* placeService.checkAccess(caller, campaign.placeId, PlaceTypes.ACCESS_TYPE_CREATE)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case _ {
                                        ignore logger.info(this, "Campaign " # campaign.pubId # " deleted by " # caller.pubId);
                                        if(fileStoreHelper.isId(campaign.cover)) {
                                            ignore fileStoreHelper.delete(campaign.cover);
                                        };
                                        repo.delete(campaign, caller._id);
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

        public func verify(
            this: actor {}
        ): async* () {
            switch(repo.findExpired(100)) {
                case (#ok(campaigns)) {
                    if(campaigns.size() > 0) {
                        ignore logger.info(this, "CampaignService.verify: Finishing " # Nat.toText(campaigns.size()) # " expired campaigns");
                        for(campaign in campaigns.vals()) {
                            // note: super admin should always have id = 1
                            ignore repo.finish(campaign, Types.RESULT_NOK, 1);
                            
                            if(campaign.kind == Types.KIND_FUNDING) {
                                await* _refundFunders(campaign, this);
                            };
                            
                            ignore notificationService.create({
                                title = "Campaign finished";
                                body = "Your Campaign [" # campaign.pubId # "](/#/c/" # campaign.pubId # ") expired and was automatically finished.";
                            }, campaign.createdBy);
                        };
                    };
                };
                case (#err(msg)) {
                    ignore logger.err(this, "CampaignService.verify: " # msg);
                };
            };
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
            entity: Types.Campaign,
            states: [Types.CampaignState]
        ): Bool {
            // any valid state?
            if(Option.isNull(
                Array.find(
                    states, 
                    func(s: Types.CampaignState): Bool = s == entity.state
                )
            )) {
                return false;
            };

            // not the same author?
            if(caller._id != entity.createdBy) {
                return false;
            };

            return true;
        };

        func canModerate(
            caller: UserTypes.Profile,
            entity: Types.Campaign,
            mod: ModerationTypes.ModerationRequest
        ): ?ReportTypes.Report {
            // not a moderator?
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
                        caller, EntityTypes.TYPE_CAMPAIGNS, entity._id, report)) {
                        return null;
                    };

                    return ?report;
                };
            };
        };
    };
};
