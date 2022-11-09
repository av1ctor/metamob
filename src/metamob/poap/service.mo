import Hex "../common/hex";
import Utils "../common/utils";
import Random "../common/random";
import Nat8 "mo:base/Nat8";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Nat32 "mo:base/Nat32";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Option "mo:base/Option";
import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";
import Types "./types";
import EntityTypes "../common/entities";
import Account "../accounts/account";
import LedgerUtils "../common/ledger";
import UserService "../users/service";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import CampaignService "../campaigns/service";
import CampaignTypes "../campaigns/types";
import DaoService "../dao/service";
import PlaceService "../places/service";
import ModerationTypes "../moderations/types";
import ModerationService "../moderations/service";
import ReportRepository "../reports/repository";
import SignatureService "../signatures/service";
import VoteService "../votes/service";
import FundingService "../fundings/service";
import DonationService "../donations/service";
import ReportTypes "../reports/types";
import Repository "./repository";
import Schema "./schema";
import Dip721 "../common/dip721";
import Dip721Types "../interfaces/dip721";
import Table "mo:mo-table/table";
import Variant "mo:mo-table/variant";
import IC "../interfaces/IC";
import Error "mo:base/Error";
import D "mo:base/Debug";
import Wasm "./dip721_wasm";

module {
    public class Service(
        daoService: DaoService.Service,
        userService: UserService.Service,
        campaignService: CampaignService.Service,
        signatureService: SignatureService.Service,
        voteService: VoteService.Service,
        fundingService: FundingService.Service,
        donationService: DonationService.Service,
        placeService: PlaceService.Service,
        moderationService: ModerationService.Service,
        reportRepo: ReportRepository.Repository, 
        ledgerUtils: LedgerUtils.LedgerUtils
    ) {
        let ic: IC.ICActor = actor("aaaaa-aa");
        let repo = Repository.Repository();
        let campaignRepo = campaignService.getRepository();
        let rand = Random.Xoshiro256ss(Utils.genRandomSeed("poaps"));

        public func create(
            req: Types.PoapRequest,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Types.Poap, Text> {
            let caller = switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(caller)) {
                    caller;
                };
            };

            if(not hasAuth(caller)) {
                return #err("Forbidden");
            };

            let campaign = switch(canChangeCampaign(req.campaignId, caller._id)) {
                case (#err(msg)) {
                    return #err(msg);
                };
                case (#ok(campaign)) {
                    campaign;
                };
            };

            try {
                switch(await placeService.checkAccess(caller, campaign.placeId)) {
                    case (#err(msg)) {
                        return #err(msg);
                    };
                    case _ {
                    };
                };
            
                let price = daoService.configGetAsNat64("POAP_DEPLOYING_PRICE");
                let balance = await ledgerUtils.getUserBalance(invoker, this);
                if(balance < price + Nat64.fromNat(LedgerUtils.icp_fee)) {
                    return #err("Insufficient ICP balance");
                };

                if(req.price < daoService.configGetAsNat64("POAP_MINTING_MIN_PRICE")) {
                    return #err("Price too low");
                };

                let app = Account.accountIdentifier(
                    Principal.fromActor(this), 
                    Account.defaultSubaccount()
                );

                switch(await ledgerUtils.transferFromUserSubaccount(caller._id, price, app, invoker, this)) {
                    case (#err(msg)) {
                        return #err(msg);
                    };
                    case _ {
                    };
                };
            
                Cycles.add(Nat64.toNat(daoService.configGetAsNat64("POAP_DEPLOYING_CYCLES")));
                let id = await ic.create_canister({
                    settings = ?{
                        controllers = ?[Principal.fromActor(this)];
                        compute_allocation = null;
                        memory_allocation = null;
                        freezing_threshold = null;
                    }
                });

                await ic.install_code({
                    mode = #install;
                    canister_id = id.canister_id;
                    wasm_module = Wasm.wasm;
                    arg = to_candid({
                        logo = ?req.logo;
                        name = ?req.name;
                        custodians = [Principal.fromActor(this)];
                        symbol = ?req.symbol;
                    });
                });

                repo.create(req, Principal.toText(id.canister_id), caller._id);
            }
            catch(e) {
                D.print("Error: poapService.create(" # debug_show(invoker) # "):" # Error.message(e));
                #err(Error.message(e));
            };
        };

        public func update(
            id: Text, 
            req: Types.PoapRequest,
            invoker: Principal
        ): async Result.Result<Types.Poap, Text> {
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

                                switch(canChangeCampaign(entity.campaignId, caller._id)) {
                                    case (#err(msg)) {
                                        #err(msg);
                                    };
                                    case (#ok(campaign)) {
                                        switch(await placeService.checkAccess(caller, campaign.placeId)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case _ {
                                                if(req.campaignId != entity.campaignId) {
                                                    return #err("Invalid field: campaignId");
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

        public func mint(
            id: Text,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Nat32, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    };

                    switch(repo.findByPubId(id)) {
                        case (#err(msg)) {
                            return #err(msg);
                        };
                        case (#ok(entity)) {
                            if(entity.state != Types.POAP_STATE_MINTING) {
                                return #err("Not minting");
                            };

                            switch(campaignRepo.findById(entity.campaignId)) {
                                case (#err(msg)) {
                                    return #err(msg);
                                };
                                case (#ok(campaign)) {
                                    switch(_checkCampaign(campaign, caller)) {
                                        case (#err(msg)) {
                                            return #err(msg);
                                        };
                                        case _ {
                                        };
                                    };

                                    try {
                                        let balance = await ledgerUtils.getUserBalance(Principal.fromText(caller.principal), this);
                                        if(balance < entity.price + Nat64.fromNat(LedgerUtils.icp_fee)) {
                                            return #err("Insufficient user ICP balance");
                                        };
                                        
                                        switch(await ledgerUtils
                                            .transferFromUserSubaccountToCampaignSubaccountEx(
                                                campaign, caller._id, entity.price, invoker, this)) {
                                            case (#err(msg)) {
                                                return #err(msg);
                                            };
                                            case (#ok(amount)) {
                                                let app = Account.accountIdentifier(
                                                    Principal.fromActor(this), 
                                                    Account.defaultSubaccount()
                                                );

                                                let cut = daoService.configGetAsNat64("POAP_MINTING_TAX");

                                                switch(await ledgerUtils.withdrawFromCampaignSubaccount(campaign, (entity.price * cut) / 100, app, caller._id)) {
                                                    case (#err(msg)) {
                                                        return #err(msg);
                                                    };
                                                    case _ {
                                                    };
                                                };

                                                return await _mintNFT(entity, campaign, caller);
                                            };
                                        };
                                    }
                                    catch(e) {
                                        D.print("Error: poapService.mint(" # debug_show(invoker) # "):" # Error.message(e));
                                        return #err(Error.message(e));
                                    };
                                };
                            };
                        };
                    };

                };
            };
            
        };

        func _checkCampaign(
            campaign: CampaignTypes.Campaign,
            caller: UserTypes.Profile
        ): Result.Result<(), Text> {
            if(campaign.state != CampaignTypes.STATE_PUBLISHED) {
                return #err("Invalid campaign state");
            };

            if(campaign.kind == CampaignTypes.KIND_SIGNATURES) {
                switch(signatureService.findByCampaignAndUser(campaign._id, caller._id)) {
                    case (#err(_)) {
                        #err("No user signature found");
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(campaign.kind == CampaignTypes.KIND_VOTES or campaign.kind == CampaignTypes.KIND_WEIGHTED_VOTES) {
                switch(voteService.findByCampaignAndUser(campaign._id, caller._id)) {
                    case (#err(_)) {
                        #err("No user vote found");
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(campaign.kind == CampaignTypes.KIND_FUNDING) {
                switch(fundingService.findByCampaignAndUser(campaign._id, caller._id)) {
                    case (#err(_)) {
                        #err("No user funding found");
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else if(campaign.kind == CampaignTypes.KIND_DONATIONS) {
                switch(donationService.findByCampaignAndUser(campaign._id, caller._id)) {
                    case (#err(_)) {
                        #err("No user donation found");
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            else {
                #err("Unsupported campaign kind");
            };
        };

        func _generateNFT(
            poap: Types.Poap,
            id: Nat,
            rgbBgColor: Text,
            caller: UserTypes.Profile
        ): Blob {
            let w = Nat32.toText(poap.width);
            let h = Nat32.toText(poap.height);
            Text.encodeUtf8(
                "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>" #
                "<svg version=\"1.1\" viewBox=\"0 0 " # w # " " # h # "\" xmlns=\"http://www.w3.org/2000/svg\"><rect fill=\"" # rgbBgColor # "\" width=\"" # w # "\" height=\"" # h # "\"/>"
                    # poap.body # 
                "</svg>"
            )
        };

        func _generateColor(
        ): (Nat8, Nat8, Nat8) {
            let value = rand.next();
            (
                Nat8.fromNat(Nat64.toNat((value & 0x000000000000ff))), 
                Nat8.fromNat(Nat64.toNat((value & 0x00000000ff0000) >> 16)),
                Nat8.fromNat(Nat64.toNat((value & 0x0000ff00000000) >> 32))
            )
        };

        func _toRGB(
            color: (Nat8, Nat8, Nat8)
        ): Text {
            "#" # Hex.encode([color.0, color.1, color.2])
        };

        func _revertSupplyChange(
            poapId: Nat32
        ) {
            switch(repo.findById(poapId)) {
                case (#ok(poap)) {
                    ignore repo.changeSupply(poap, -1);
                };
                case _ {
                };
            };
        };

        func _mintNFT(
            poap: Types.Poap,
            campaign: CampaignTypes.Campaign,
            caller: UserTypes.Profile
        ): async Result.Result<Nat32, Text> {
            try {
                let id = Nat32.toNat(poap.totalSupply);
                let bgColor = _generateColor();
                let rgbBgColor = _toRGB(bgColor);
                let props: [(Text, Dip721Types.GenericValue)] = [
                    ("data", #BlobContent(_generateNFT(poap, id, rgbBgColor, caller))),
                    ("contentType", #TextContent("image/svg+xml")),
                    ("id", #NatContent(id)),
                    ("campaingId", #TextContent(campaign.pubId)),
                    ("date", #IntContent(Time.now())),
                    ("bgColor", #TextContent(rgbBgColor)),
                ];

                ignore repo.changeSupply(poap, 1);
                
                switch(await Dip721.mint(poap.canisterId, Principal.fromText(caller.principal), id, props)) {
                    case (#Err(msg)) {
                        _revertSupplyChange(poap._id);
                        #err(debug_show(msg));
                    };
                    case (#Ok(_)) {
                        #ok(poap.totalSupply);
                    };
                };
            }
            catch(e) {
                _revertSupplyChange(poap._id);
                D.print("Error: poapService._mintNft(" # caller.principal # "):" # Error.message(e));
                return #err(Error.message(e));
            };
        };

        public func moderate(
            id: Text, 
            req: Types.PoapRequest,
            mod: ModerationTypes.ModerationRequest,
            invoker: Principal
        ): Result.Result<Types.Poap, Text> {
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
                            case (#ok(poap)) {
                                switch(canModerate(caller, poap, mod)) {
                                    case null {
                                        return #err("Forbidden");
                                    };

                                    case (?report) {
                                        if(req.price != poap.price) {
                                            return #err("Price can't be changed");
                                        };

                                        if(poap.maxSupply != req.maxSupply) {
                                            return #err("Max supply can't be changed");
                                        };

                                        if(poap.options != req.options) {
                                            return #err("Options can't be changed");
                                        };

                                        switch(moderationService.create(
                                            mod, report, Variant.hashMapToMap(Repository.serialize(poap, false)), caller)) {
                                            case (#err(msg)) {
                                                #err(msg);
                                            };
                                            case (#ok(moderation)) {
                                                repo.moderate(
                                                    poap, req, moderation, caller._id
                                                );
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

        public func findById(
            _id: Nat32, 
            invoker: Principal
        ): Result.Result<Types.Poap, Text> {
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
        ): Result.Result<Types.Poap, Text> {
            repo.findByPubId(pubId);
        };

        public func find(
            criterias: ?[(Text, Text, Variant.Variant)],
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Poap], Text> {
            repo.find(criterias, sortBy, limit);
        };

        public func findByCampaign(
            campaignId: Nat32,
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat)
        ): Result.Result<[Types.Poap], Text> {
            repo.findByCampaign(campaignId, sortBy, limit);
        };

        public func findByUser(
            sortBy: ?[(Text, Text)],
            limit: ?(Nat, Nat),
            invoker: Principal
        ): Result.Result<[Types.Poap], Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    };

                    repo.findByUser(caller._id, sortBy, limit);
                };
            };
        };

        public func findByCampaignAndUser(
            campaignId: Nat32,
            userId: Nat32
        ): Result.Result<[Types.Poap], Text> {
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

                                if(entity.state != Types.POAP_STATE_CANCELLED) {
                                    return #err("Invalid POAP state");
                                };
                                
                                switch(canChangeCampaign(entity.campaignId, caller._id)) {
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

            if(caller.banned == UserTypes.BANNED_AS_USER) {
                return false;
            };

            return true;
        };

        func canChange(
            caller: UserTypes.Profile,
            entity: Types.Poap
        ): Bool {
            if(caller._id != entity.createdBy) {
                return false;
            };

            return true;
        };

        func canChangeCampaign(
            campaignId: Nat32,
            callerId: Nat32
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
                        if(campaign.createdBy != callerId) {
                            #err("Forbidden");
                        }
                        else {
                            #ok(campaign);
                        };
                    };
                };
            };
        };

        func canModerate(
            caller: UserTypes.Profile,
            entity: Types.Poap,
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
                        caller, EntityTypes.TYPE_POAPS, entity._id, report)) {
                        return null;
                    };

                    return ?report;
                };
            };
        };
    };
};