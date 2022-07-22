import Array "mo:base/Array";
import CampaignService "./campaigns/service";
import CampaignTypes "./campaigns/types";
import CategoryService "./categories/service";
import CategoryTypes "./categories/types";
import D "mo:base/Debug";
import DaoService "./dao/service";
import DaoTypes "./dao/types";
import DonationService "./donations/service";
import DonationTypes "./donations/types";
import EntityTypes "common/entities";
import FundingService "./fundings/service";
import FundingTypes "./fundings/types";
import Int "mo:base/Int";
import LedgerUtils "./common/ledger";
import ModerationService "./moderations/service";
import ModerationTypes "./moderations/types";
import Nat64 "mo:base/Nat64";
import PlaceEmailService "./places-emails/service";
import PlaceEmailTypes "./places-emails/types";
import PlaceService "./places/service";
import PlaceTypes "./places/types";
import PlaceUserService "./places-users/service";
import PlaceUserTypes "./places-users/types";
import Principal "mo:base/Principal";
import ReportRepository "./reports/repository";
import ReportService "./reports/service";
import ReportTypes "./reports/types";
import Result "mo:base/Result";
import SignatureService "./signatures/service";
import SignatureTypes "./signatures/types";
import Time "mo:base/Time";
import UpdateService "./updates/service";
import UpdateTypes "./updates/types";
import UserRepository "./users/repository";
import UserService "./users/service";
import UserTypes "./users/types";
import Variant "mo:mo-table/variant";
import VoteService "./votes/service";
import VoteTypes "./votes/types";

shared({caller = owner}) actor class Metamob(
    ledgerCanisterId: Text,
    mmtCanisterId: Text
) = this {

    // helpers
    let ledgerUtils = LedgerUtils.LedgerUtils(ledgerCanisterId);

    // services
    let userRepo = UserRepository.Repository();
    let reportRepo = ReportRepository.Repository();

    let daoService = DaoService.Service(mmtCanisterId);
    let moderationService = ModerationService.Service(daoService, userRepo, reportRepo);
    let userService = UserService.Service(userRepo, daoService, moderationService, reportRepo, ledgerUtils);
    let placeService = PlaceService.Service(userService, moderationService, reportRepo);
    let placeEmailService = PlaceEmailService.Service(userService, placeService);
    let placeUserService = PlaceUserService.Service(userService, placeService);
    let categoryService = CategoryService.Service(userService);
    let campaignService = CampaignService.Service(userService, placeService, moderationService, reportRepo, ledgerUtils);
    let signatureService = SignatureService.Service(userService, campaignService, placeService, moderationService, reportRepo);
    let voteService = VoteService.Service(userService, campaignService, placeService, moderationService, reportRepo);
    let donationService = DonationService.Service(userService, campaignService, placeService, moderationService, reportRepo, ledgerUtils);
    let fundingService = FundingService.Service(userService, campaignService, placeService, moderationService, reportRepo, ledgerUtils);
    let updateService = UpdateService.Service(userService, campaignService, placeService, moderationService, reportRepo);
    let reportService = ReportService.Service(reportRepo, daoService, userService, campaignService, signatureService, 
        voteService, fundingService, donationService, updateService, placeService);

    // DAO facade
    public shared query(msg) func daoConfigGetAsNat32(
        key: Text
    ): async Nat32 {
        daoService.configGetAsNat32(key);
    };

    public shared query(msg) func daoConfigGetAsNat64(
        key: Text
    ): async Nat64 {
        daoService.configGetAsNat64(key);
    };

    public shared(msg) func daoStake(
        value: Nat64
    ): async Result.Result<(), Text> {
        await daoService.stake(Nat64.toNat(value), msg.caller, this);
    };

    public shared(msg) func daoWithdraw(
        value: Nat64
    ): async Result.Result<(), Text> {
        await daoService.withdraw(Nat64.toNat(value), msg.caller, this);
    };

    public shared query(msg) func daoStakedBalance(
    ): async Nat64 {
        Nat64.fromNat(daoService.stakedBalanceOf(msg.caller));
    };

    /*public shared(msg) func daoReward(
        principal: Principal,
        value: Nat64
    ): async Result.Result<(), Text> {
        await daoService.rewardUser(principal, value);
    };*/
    
    //
    // users facade
    //
    public shared(msg) func userCreate(
        req: UserTypes.ProfileRequest
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.create(req, msg.caller, owner));
    };

    public shared(msg) func userUpdateMe(
        req: UserTypes.ProfileRequest
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.updateMe(req, msg.caller));
    };

    public shared(msg) func userUpdate(
        id: Text, 
        req: UserTypes.ProfileRequest
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.update(id, req, msg.caller));
    };

    public shared(msg) func userModerate(
        id: Text, 
        req: UserTypes.ProfileRequest,
        mod: ModerationTypes.ModerationRequest
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.moderate(id, req, mod, msg.caller));
    };

    public shared(msg) func userSignupAsModerator(
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.signupAsModerator(msg.caller));
    };

    public query func userFindById(
        _id: Nat32
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.findById(_id));
    };

    public shared query(msg) func userFindByIdEx(
        _id: Nat32
    ): async Result.Result<UserTypes.Profile, Text> {
        userService.findByIdEx(_id, msg.caller);
    };

    public query func userFindByPubId(
        pubId: Text
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.findByPubId(pubId));
    };

    public shared query(msg) func userFindMe(
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.findByPrincipal(msg.caller));
    };

    public shared query(msg) func userFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[UserTypes.Profile], Text> {
        userService.find(criterias, sortBy, limit, msg.caller);
    };

    public shared query(msg) func userGetAccountId(
    ): async Blob {
        userService.getAccountId(msg.caller, this);
    };

    private func _redactUser(
        prof: UserTypes.Profile
    ): UserTypes.ProfileResponse {
        {
            _id = prof._id;
            pubId = prof.pubId;
            name = prof.name;
            email = "";
            avatar = prof.avatar;
            roles = prof.roles;
            country = prof.country;
        }
    };

    private func _transformUserReponse(
        res: Result.Result<UserTypes.Profile, Text>
    ): Result.Result<UserTypes.ProfileResponse, Text> {
        switch(res)
        {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(prof)) {
                #ok(_redactUser(prof));
            };
        };
    };

    func _transformUserResponses(
        res: Result.Result<[UserTypes.Profile], Text>
    ): Result.Result<[UserTypes.ProfileResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(entities, _redactUser));
            };
        };
    };

    //
    // categories facade
    //
    public shared(msg) func categoryCreate(
        req: CategoryTypes.CategoryRequest
    ): async Result.Result<CategoryTypes.Category, Text> {
        categoryService.create(req, msg.caller);
    };

    public shared(msg) func categoryUpdate(
        id: Text, 
        req: CategoryTypes.CategoryRequest
    ): async Result.Result<CategoryTypes.Category, Text> {
        categoryService.update(id, req, msg.caller);
    };

    public query func categoryFindById(
        _id: Nat32
    ): async Result.Result<CategoryTypes.Category, Text> {
        categoryService.findById(_id);
    };

    public shared query(msg) func categoryFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[CategoryTypes.Category], Text> {
        categoryService.find(criterias, sortBy, limit, msg.caller);
    };

    public shared query(msg) func categoryFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[CategoryTypes.Category], Text> {
        categoryService.findByUser(userId, sortBy, limit, msg.caller);
    };

    public shared(msg) func categoryDelete(
        id: Text
    ): async Result.Result<(), Text> {
        categoryService.delete(id, msg.caller);
    };

    //
    // campaigns facade
    //
    public shared(msg) func campaignCreate(
        req: CampaignTypes.CampaignRequest
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        await campaignService.create(req, msg.caller);
    };

    public shared(msg) func campaignUpdate(
        pubId: Text, 
        req: CampaignTypes.CampaignRequest
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        await campaignService.update(pubId, req, msg.caller, this);
    };

    public shared(msg) func campaignModerate(
        pubId: Text, 
        req: CampaignTypes.CampaignRequest,
        mod: ModerationTypes.ModerationRequest
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        campaignService.moderate(pubId, req, mod, msg.caller);
    };

    public shared(msg) func campaignBoost(
        pubId: Text, 
        value: Nat64
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        await campaignService.boost(pubId, value, msg.caller, this);
    };

    public query func campaignFindById(
        _id: Nat32
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        campaignService.findById(_id);
    };
    
    public query func campaignFindByPubId(
        pubId: Text
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        campaignService.findByPubId(pubId);
    };

    public shared query(msg) func campaignFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.find(criterias, sortBy, limit);
    };

    public query func campaignFindByCategory(
        categoryId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.findByCategory(categoryId, sortBy, limit);
    };

    public query func campaignFindByPlace(
        placeId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.findByPlace(placeId, sortBy, limit);
    };

    public shared query(msg) func campaignFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.findByUser(userId, sortBy, limit, msg.caller);
    };

    public shared(msg) func campaignDelete(
        pubId: Text
    ): async Result.Result<(), Text> {
        await campaignService.delete(pubId, msg.caller);
    };

    //
    // signatures facade
    //
    public shared(msg) func signatureCreate(
        req: SignatureTypes.SignatureRequest
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponse(await signatureService.create(req, msg.caller, this), false);
    };

    public shared(msg) func signatureUpdate(
        id: Text, 
        req: SignatureTypes.SignatureRequest
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponse(await signatureService.update(id, req, msg.caller), false);
    };

    public shared(msg) func signatureModerate(
        id: Text, 
        req: SignatureTypes.SignatureRequest,
        mod: ModerationTypes.ModerationRequest
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponse(signatureService.moderate(id, req, mod, msg.caller), false);
    };

    public shared query(msg) func signatureFindById(
        _id: Nat32
    ): async Result.Result<SignatureTypes.Signature, Text> {
        signatureService.findById(_id, msg.caller);
    };

    public query func signatureFindByPubId(
        pubId: Text
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponse(signatureService.findByPubId(pubId), true);
    };

    public shared query(msg) func signatureFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.SignatureResponse], Text> {
        _transformSignatureResponses(signatureService.find(criterias, sortBy, limit), true);
    };

    public query func signatureFindByCampaign(
        campaignId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.SignatureResponse], Text> {
        _transformSignatureResponses(signatureService.findByCampaign(campaignId, sortBy, limit), true);
    };

    public query func signatureCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        signatureService.countByCampaign(campaignId);
    };

    public shared query(msg) func signatureFindByUser(
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.SignatureResponse], Text> {
        _transformSignatureResponses(signatureService.findByUser(sortBy, limit, msg.caller), false);
    };

    public query func signatureFindByCampaignAndUser(
        campaignId: Nat32,
        userId: Nat32
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponse(signatureService.findByCampaignAndUser(campaignId, userId), true);
    };

    public shared(msg) func signatureDelete(
        id: Text
    ): async Result.Result<(), Text> {
        await signatureService.delete(id, msg.caller);
    };

    func _redactSignature(
        e: SignatureTypes.Signature,
        checkAnonymous: Bool
    ): SignatureTypes.SignatureResponse {
        if(not checkAnonymous or not e.anonymous) {
            {
                _id = e._id;
                pubId = e.pubId;
                body = e.body;
                anonymous = e.anonymous;
                campaignId = e.campaignId;
                moderated = e.moderated;
                createdAt = e.createdAt;
                createdBy = ?e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
            };
        }
        else {
            {
                _id = e._id;
                pubId = e.pubId;
                body = e.body;
                anonymous = e.anonymous;
                campaignId = e.campaignId;
                moderated = e.moderated;
                createdAt = e.createdAt;
                createdBy = null;
                updatedAt = e.updatedAt;
                updatedBy = null;
            };
        };
    };

    func _transformSignatureResponse(
        res: Result.Result<SignatureTypes.Signature, Text>,
        checkAnonymous: Bool
    ): Result.Result<SignatureTypes.SignatureResponse, Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(e)) {
                #ok(_redactSignature(e, checkAnonymous));
            };
        };
    };

    func _transformSignatureResponses(
        res: Result.Result<[SignatureTypes.Signature], Text>,
        checkAnonymous: Bool
    ): Result.Result<[SignatureTypes.SignatureResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(
                    entities, 
                    func (e: SignatureTypes.Signature): SignatureTypes.SignatureResponse = 
                        _redactSignature(e, checkAnonymous)
                ));
            };
        };
    };    

    //
    // votes facade
    //
    public shared(msg) func voteCreate(
        req: VoteTypes.VoteRequest
    ): async Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponse(await voteService.create(req, msg.caller, this), false);
    };

    public shared(msg) func voteUpdate(
        id: Text, 
        req: VoteTypes.VoteRequest
    ): async Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponse(await voteService.update(id, req, msg.caller), false);
    };

    public shared(msg) func voteModerate(
        id: Text, 
        req: VoteTypes.VoteRequest,
        mod: ModerationTypes.ModerationRequest
    ): async Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponse(voteService.moderate(id, req, mod, msg.caller), false);
    };

    public shared query(msg) func voteFindById(
        _id: Nat32
    ): async Result.Result<VoteTypes.Vote, Text> {
        voteService.findById(_id, msg.caller);
    };

    public query func voteFindByPubId(
        pubId: Text
    ): async Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponse(voteService.findByPubId(pubId), true);
    };

    public shared query(msg) func voteFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[VoteTypes.VoteResponse], Text> {
        _transformVoteResponses(voteService.find(criterias, sortBy, limit), true);
    };

    public query func voteFindByCampaign(
        campaignId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[VoteTypes.VoteResponse], Text> {
        _transformVoteResponses(voteService.findByCampaign(campaignId, sortBy, limit), true);
    };

    public query func voteCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        voteService.countByCampaign(campaignId);
    };

    public shared query(msg) func voteFindByUser(
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[VoteTypes.VoteResponse], Text> {
        _transformVoteResponses(voteService.findByUser(sortBy, limit, msg.caller), false);
    };

    public query func voteFindByCampaignAndUser(
        campaignId: Nat32,
        userId: Nat32
    ): async Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponse(voteService.findByCampaignAndUser(campaignId, userId), true);
    };

    public shared(msg) func voteDelete(
        id: Text
    ): async Result.Result<(), Text> {
        await voteService.delete(id, msg.caller);
    };

    func _redactVote(
        e: VoteTypes.Vote,
        checkAnonymous: Bool
    ): VoteTypes.VoteResponse {
        if(not checkAnonymous or not e.anonymous) {
            {
                _id = e._id;
                pubId = e.pubId;
                anonymous = e.anonymous;
                campaignId = e.campaignId;
                body = e.body;
                pro = e.pro;
                weight = e.weight;
                moderated = e.moderated;
                createdAt = e.createdAt;
                createdBy = ?e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
            };
        }
        else {
            {
                _id = e._id;
                pubId = e.pubId;
                anonymous = e.anonymous;
                campaignId = e.campaignId;
                body = e.body;
                pro = e.pro;
                weight = e.weight;
                moderated = e.moderated;
                createdAt = e.createdAt;
                createdBy = null;
                updatedAt = e.updatedAt;
                updatedBy = null;
            };
        };
    };

    func _transformVoteResponse(
        res: Result.Result<VoteTypes.Vote, Text>,
        checkAnonymous: Bool
    ): Result.Result<VoteTypes.VoteResponse, Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(e)) {
                #ok(_redactVote(e, checkAnonymous));
            };
        };
    };

    func _transformVoteResponses(
        res: Result.Result<[VoteTypes.Vote], Text>,
        checkAnonymous: Bool
    ): Result.Result<[VoteTypes.VoteResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(
                    entities, 
                    func (e: VoteTypes.Vote): VoteTypes.VoteResponse = 
                    _redactVote(e, checkAnonymous)
                ));
            };
        };
    };

    //
    // donations facade
    //
    public shared(msg) func donationCreate(
        req: DonationTypes.DonationRequest
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponse(await donationService.create(req, msg.caller), false);
    };

    public shared(msg) func donationComplete(
        pubId: Text
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponse(await donationService.complete(pubId, msg.caller, this), false);
    };

    public shared(msg) func donationUpdate(
        id: Text, 
        req: DonationTypes.DonationRequest
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponse(await donationService.update(id, req, msg.caller), false);
    };

    public shared(msg) func donationModerate(
        id: Text, 
        req: DonationTypes.DonationRequest,
        mod: ModerationTypes.ModerationRequest
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponse(donationService.moderate(id, req, mod, msg.caller), false);
    };

    public shared query(msg) func donationFindById(
        _id: Nat32
    ): async Result.Result<DonationTypes.Donation, Text> {
        donationService.findById(_id, msg.caller);
    };

    public query func donationFindByPubId(
        pubId: Text
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponse(donationService.findByPubId(pubId), true);
    };

    public shared query(msg) func donationFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[DonationTypes.DonationResponse], Text> {
        _transformDonationResponses(donationService.find(criterias, sortBy, limit), true);
    };

    public query func donationFindByCampaign(
        campaignId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[DonationTypes.DonationResponse], Text> {
        _transformDonationResponses(donationService.findByCampaign(campaignId, sortBy, limit), true);
    };

    public query func donationCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        donationService.countByCampaign(campaignId);
    };

    public shared query(msg) func donationFindByUser(
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[DonationTypes.DonationResponse], Text> {
        _transformDonationResponses(donationService.findByUser(sortBy, limit, msg.caller), false);
    };

    public query func donationFindByCampaignAndUser(
        campaignId: Nat32,
        userId: Nat32
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponse(donationService.findByCampaignAndUser(campaignId, userId), true);
    };

    public shared(msg) func donationDelete(
        id: Text
    ): async Result.Result<(), Text> {
        await donationService.delete(id, msg.caller, this);
    };

    func _redactDonation(
        e: DonationTypes.Donation,
        checkAnonymous: Bool
    ): DonationTypes.DonationResponse {
        if(not checkAnonymous or not e.anonymous) {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                anonymous = e.anonymous;
                body = e.body;
                value = e.value;
                moderated = e.moderated;
                campaignId = e.campaignId;
                createdAt = e.createdAt;
                createdBy = ?e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
            };
        }
        else {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                anonymous = e.anonymous;
                campaignId = e.campaignId;
                body = e.body;
                value = e.value;
                moderated = e.moderated;
                createdAt = e.createdAt;
                createdBy = null;
                updatedAt = e.updatedAt;
                updatedBy = null;
            };
        };
    };

    func _transformDonationResponse(
        res: Result.Result<DonationTypes.Donation, Text>,
        checkAnonymous: Bool
    ): Result.Result<DonationTypes.DonationResponse, Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(e)) {
                #ok(_redactDonation(e, checkAnonymous));
            };
        };
    };

    func _transformDonationResponses(
        res: Result.Result<[DonationTypes.Donation], Text>,
        checkAnonymous: Bool
    ): Result.Result<[DonationTypes.DonationResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(
                    entities, 
                    func (e: DonationTypes.Donation): DonationTypes.DonationResponse = 
                        _redactDonation(e, checkAnonymous)
                ));
            };
        };
    };

    //
    // fundings facade
    //
    public shared(msg) func fundingCreate(
        req: FundingTypes.FundingRequest
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponse(await fundingService.create(req, msg.caller), false);
    };

    public shared(msg) func fundingComplete(
        pubId: Text
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponse(await fundingService.complete(pubId, msg.caller, this), false);
    };

    public shared(msg) func fundingUpdate(
        id: Text, 
        req: FundingTypes.FundingRequest
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponse(await fundingService.update(id, req, msg.caller), false);
    };

    public shared(msg) func fundingModerate(
        id: Text, 
        req: FundingTypes.FundingRequest,
        mod: ModerationTypes.ModerationRequest
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponse(fundingService.moderate(id, req, mod, msg.caller), false);
    };

    public shared query(msg) func fundingFindById(
        _id: Nat32
    ): async Result.Result<FundingTypes.Funding, Text> {
        fundingService.findById(_id, msg.caller);
    };

    public query func fundingFindByPubId(
        pubId: Text
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponse(fundingService.findByPubId(pubId), true);
    };

    public shared query(msg) func fundingFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[FundingTypes.FundingResponse], Text> {
        _transformFundingResponses(fundingService.find(criterias, sortBy, limit), true);
    };

    public query func fundingFindByCampaign(
        campaignId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[FundingTypes.FundingResponse], Text> {
        _transformFundingResponses(fundingService.findByCampaign(campaignId, sortBy, limit), true);
    };

    public query func fundingCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        fundingService.countByCampaign(campaignId);
    };

    public shared query(msg) func fundingFindByUser(
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[FundingTypes.FundingResponse], Text> {
        _transformFundingResponses(fundingService.findByUser(sortBy, limit, msg.caller), false);
    };

    public query func fundingFindByCampaignAndUser(
        campaignId: Nat32,
        userId: Nat32
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponse(fundingService.findByCampaignAndUser(campaignId, userId), true);
    };

    public shared(msg) func fundingDelete(
        id: Text
    ): async Result.Result<(), Text> {
        await fundingService.delete(id, msg.caller, this);
    };

    func _redactFunding(
        e: FundingTypes.Funding,
        checkAnonymous: Bool
    ): FundingTypes.FundingResponse {
        if(not checkAnonymous or not e.anonymous) {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                anonymous = e.anonymous;
                body = e.body;
                tier = e.tier;
                amount = e.amount;
                value = e.value;
                moderated = e.moderated;
                campaignId = e.campaignId;
                createdAt = e.createdAt;
                createdBy = ?e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
            };
        }
        else {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                anonymous = e.anonymous;
                campaignId = e.campaignId;
                body = e.body;
                tier = e.tier;
                amount = e.amount;
                value = e.value;
                moderated = e.moderated;
                createdAt = e.createdAt;
                createdBy = null;
                updatedAt = e.updatedAt;
                updatedBy = null;
            };
        };
    };

    func _transformFundingResponse(
        res: Result.Result<FundingTypes.Funding, Text>,
        checkAnonymous: Bool
    ): Result.Result<FundingTypes.FundingResponse, Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(e)) {
                #ok(_redactFunding(e, checkAnonymous));
            };
        };
    };

    func _transformFundingResponses(
        res: Result.Result<[FundingTypes.Funding], Text>,
        checkAnonymous: Bool
    ): Result.Result<[FundingTypes.FundingResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(
                    entities, 
                    func (e: FundingTypes.Funding): FundingTypes.FundingResponse = 
                        _redactFunding(e, checkAnonymous)
                ));
            };
        };
    };

    //
    // updates facade
    //
    public shared(msg) func updateCreate(
        req: UpdateTypes.UpdateRequest
    ): async Result.Result<UpdateTypes.Update, Text> {
        await updateService.create(req, msg.caller);
    };

    public shared(msg) func updateCreateAndFinishCampaign(
        req: UpdateTypes.UpdateRequest,
        result: CampaignTypes.CampaignResult
    ): async Result.Result<UpdateTypes.Update, Text> {
        await updateService.createAndFinishCampaign(req, result, msg.caller, this);
    };

    public shared(msg) func updateUpdate(
        id: Text, 
        req: UpdateTypes.UpdateRequest
    ): async Result.Result<UpdateTypes.Update, Text> {
        await updateService.update(id, req, msg.caller);
    };

    public shared(msg) func updateModerate(
        id: Text, 
        req: UpdateTypes.UpdateRequest,
        mod: ModerationTypes.ModerationRequest
    ): async Result.Result<UpdateTypes.Update, Text> {
        updateService.moderate(id, req, mod, msg.caller);
    };

    public shared query(msg) func updateFindById(
        _id: Nat32
    ): async Result.Result<UpdateTypes.Update, Text> {
        updateService.findById(_id, msg.caller);
    };

    public query func updateFindByPubId(
        pubId: Text
    ): async Result.Result<UpdateTypes.Update, Text> {
        updateService.findByPubId(pubId);
    };

    public shared query(msg) func updateFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[UpdateTypes.Update], Text> {
        updateService.find(criterias, sortBy, limit);
    };

    public query func updateFindByCampaign(
        campaignId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[UpdateTypes.Update], Text> {
        updateService.findByCampaign(campaignId, sortBy, limit);
    };

    public query func updateCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        updateService.countByCampaign(campaignId);
    };

    public shared query(msg) func updateFindByUser(
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[UpdateTypes.Update], Text> {
        updateService.findByUser(sortBy, limit, msg.caller);
    };

    public shared(msg) func updateDelete(
        id: Text
    ): async Result.Result<(), Text> {
        await updateService.delete(id, msg.caller);
    };   
    
    //
    // reports facade
    //
    public shared(msg) func reportCreate(
        req: ReportTypes.ReportRequest
    ): async Result.Result<ReportTypes.ReportResponse, Text> {
        _transformReportResponse(reportService.create(req, msg.caller), false);
    };

    public shared(msg) func reportUpdate(
        id: Text, 
        req: ReportTypes.ReportRequest
    ): async Result.Result<ReportTypes.ReportResponse, Text> {
        _transformReportResponse(reportService.update(id, req, msg.caller), false);
    };

    public shared(msg) func reportClose(
        id: Text, 
        req: ReportTypes.ReportCloseRequest
    ): async Result.Result<ReportTypes.ReportResponse, Text> {
        _transformReportResponse(await reportService.close(id, req, msg.caller), false);
    };

    public shared query(msg) func reportFindById(
        id: Text
    ): async Result.Result<ReportTypes.ReportResponse, Text> {
        _transformReportResponse(reportService.findById(id, msg.caller), true);
    };

    public shared query(msg) func reportFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[ReportTypes.ReportResponse], Text> {
        _transformReportResponses(reportService.find(criterias, sortBy, limit, msg.caller), true);
    };

    public shared query(msg) func reportFindByUser(
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[ReportTypes.ReportResponse], Text> {
        _transformReportResponses(reportService.findByUser(sortBy, limit, msg.caller), false);
    };

    public shared query(msg) func reportFindByReportedUser(
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[ReportTypes.ReportResponse], Text> {
        _transformReportResponses(reportService.findByReportedUser(sortBy, limit, msg.caller), true);
    };

    func _redactReport(
        e: ReportTypes.Report,
        doRedact: Bool
    ): ReportTypes.ReportResponse {
        if(doRedact) {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                result = e.result;
                entityType = e.entityType;
                entityId = e.entityId;
                entityPubId = e.entityPubId;
                entityCreatedBy = e.entityCreatedBy;
                kind = e.kind;
                description = e.description;
                resolution = e.resolution;
                createdAt = e.createdAt;
                createdBy = null;
                updatedAt = e.updatedAt;
                updatedBy = null;
                assignedAt = e.assignedAt;
                assignedTo = e.assignedTo;
            };
        }
        else {
            {
                _id = e._id;
                pubId = e.pubId;
                state = e.state;
                result = e.result;
                entityType = e.entityType;
                entityId = e.entityId;
                entityPubId = e.entityPubId;
                entityCreatedBy = e.entityCreatedBy;
                kind = e.kind;
                description = e.description;
                resolution = e.resolution;
                createdAt = e.createdAt;
                createdBy = ?e.createdBy;
                updatedAt = e.updatedAt;
                updatedBy = e.updatedBy;
                assignedAt = e.assignedAt;
                assignedTo = e.assignedTo;
            };
        };
    };

    func _transformReportResponse(
        res: Result.Result<ReportTypes.Report, Text>,
        doRedact: Bool
    ): Result.Result<ReportTypes.ReportResponse, Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(e)) {
                #ok(_redactReport(e, doRedact));
            };
        };
    };

    func _transformReportResponses(
        res: Result.Result<[ReportTypes.Report], Text>,
        doRedact: Bool
    ): Result.Result<[ReportTypes.ReportResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(
                    entities, 
                    func(e: ReportTypes.Report): ReportTypes.ReportResponse = 
                        _redactReport(e, doRedact)
                ));
            };
        };
    };

    //
    // moderations facade
    //
    public shared query(msg) func moderationFindByEntity(
        entityType: EntityTypes.EntityType,
        entityId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[ModerationTypes.Moderation], Text> {
        moderationService.findByEntity(entityType, entityId, sortBy, limit, msg.caller);
    };

    //
    // places facade
    //
    public shared(msg) func placeCreate(
        req: PlaceTypes.PlaceRequest
    ): async Result.Result<PlaceTypes.Place, Text> {
        placeService.create(req, msg.caller);
    };

    public shared(msg) func placeUpdate(
        id: Text, 
        req: PlaceTypes.PlaceRequest
    ): async Result.Result<PlaceTypes.Place, Text> {
        placeService.update(id, req, msg.caller);
    };

    public shared(msg) func placeModerate(
        id: Text, 
        req: PlaceTypes.PlaceRequest,
        mod: ModerationTypes.ModerationRequest
    ): async Result.Result<PlaceTypes.Place, Text> {
        placeService.moderate(id, req, mod, msg.caller);
    };

    public query func placeFindById(
        _id: Nat32
    ): async Result.Result<PlaceTypes.Place, Text> {
        placeService.findById(_id);
    };

    public query func placeFindByPubId(
        pubId: Text
    ): async Result.Result<PlaceTypes.Place, Text> {
        placeService.findByPubId(pubId);
    };

    public query func placeFindTreeById(
        _id: Nat32
    ): async Result.Result<[PlaceTypes.Place], Text> {
        placeService.findTreeById(_id);
    };

    public shared query(msg) func placeFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[PlaceTypes.Place], Text> {
        placeService.findByUser(userId, sortBy, limit, msg.caller);
    };

    public shared query(msg) func placeFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[PlaceTypes.Place], Text> {
        placeService.find(criterias, sortBy, limit);
    };

    //
    // places-emails facade
    //
    public shared(msg) func placeEmailCreate(
        req: PlaceEmailTypes.PlaceEmailRequest
    ): async Result.Result<PlaceEmailTypes.PlaceEmail, Text> {
        placeEmailService.create(req, msg.caller);
    };

    public shared query(msg) func placeEmailFindByPlace(
        placeId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[PlaceEmailTypes.PlaceEmail], Text> {
        placeEmailService.findByPlaceId(placeId, sortBy, limit, msg.caller);
    };

    public shared(msg) func placeEmailDelete(
        _id: Nat32
    ): async Result.Result<(), Text> {
        placeEmailService.delete(_id, msg.caller);
    };   

    //
    // places-users facade
    //
    public shared(msg) func placeUserCreate(
        req: PlaceUserTypes.PlaceUserRequest
    ): async Result.Result<PlaceUserTypes.PlaceUser, Text> {
        placeUserService.create(req, msg.caller);
    };

    public shared(msg) func placeUserUpdate(
        req: PlaceUserTypes.PlaceUserRequest
    ): async Result.Result<PlaceUserTypes.PlaceUser, Text> {
        placeUserService.update(req, msg.caller);
    };

    public shared query(msg) func placeUserFindByPlaceAndUser(
        placeId: Nat32,
        userId: Nat32
    ): async Result.Result<PlaceUserTypes.PlaceUser, Text> {
        placeUserService.findByPlaceIdAndUserId(placeId, userId);
    };

    public shared(msg) func placeUserDelete(
        _id: Nat32
    ): async Result.Result<(), Text> {
        placeUserService.delete(_id, msg.caller);
    };

    //
    // migration
    //
    stable var daoEntities: DaoTypes.BackupEntity = {
        config = [];
        staked = [];
    };
    stable var userEntities: [[(Text, Variant.Variant)]] = [];
    stable var categoryEntities: [[(Text, Variant.Variant)]] = [];
    stable var campaignEntities: [[(Text, Variant.Variant)]] = [];
    stable var signatureEntities: [[(Text, Variant.Variant)]] = [];
    stable var voteEntities: [[(Text, Variant.Variant)]] = [];
    stable var donationEntities: [[(Text, Variant.Variant)]] = [];
    stable var fundingEntities: [[(Text, Variant.Variant)]] = [];
    stable var updateEntities: [[(Text, Variant.Variant)]] = [];
    stable var reportEntities: [[(Text, Variant.Variant)]] = [];
    stable var moderationEntities: [[(Text, Variant.Variant)]] = [];
    stable var placeEntities: [[(Text, Variant.Variant)]] = [];
    stable var placeEmailEntities: [[(Text, Variant.Variant)]] = [];
    stable var placeUserEntities: [[(Text, Variant.Variant)]] = [];

    system func preupgrade() {
        daoEntities := daoService.backup();
        userEntities := userService.backup();
        categoryEntities := categoryService.backup();
        campaignEntities := campaignService.backup();
        signatureEntities := signatureService.backup();
        voteEntities := voteService.backup();
        donationEntities := donationService.backup();
        fundingEntities := fundingService.backup();
        updateEntities := updateService.backup();
        reportEntities := reportService.backup();
        moderationEntities := moderationService.backup();
        placeEntities := placeService.backup();
        placeEmailEntities := placeEmailService.backup();
        placeUserEntities := placeUserService.backup();
    };

    system func postupgrade() {
        daoService.restore(daoEntities);
        daoEntities := {
            config = [];
            staked = [];
        };
        
        userService.restore(userEntities);
        userEntities := [];
        
        categoryService.restore(categoryEntities);
        categoryEntities := [];
        
        campaignService.restore(campaignEntities);
        campaignEntities := [];
        
        signatureService.restore(signatureEntities);
        signatureEntities := [];
        
        voteService.restore(voteEntities);
        voteEntities := [];
        
        donationService.restore(donationEntities);
        donationEntities := [];

        fundingService.restore(fundingEntities);
        fundingEntities := [];
        
        updateService.restore(updateEntities);
        updateEntities := [];
        
        reportService.restore(reportEntities);
        reportEntities := [];

        moderationService.restore(moderationEntities);
        moderationEntities := [];
        
        placeService.restore(placeEntities);
        placeEntities := [];
        
        placeEmailService.restore(placeEmailEntities);
        placeEmailEntities := [];

        placeUserService.restore(placeUserEntities);
        placeUserEntities := [];
    };

    let interval: Nat = 60 * 1000_000_000; // 1 minute
    var lastExec: Nat = Int.abs(Time.now());
    var running: Bool = false;

    system func heartbeat(
    ): async () {
        let now = Int.abs(Time.now());
        if(now >= lastExec + interval and not running) {
            running := true;
            lastExec := now;
            D.print("Info: heartbeat: Verifying...");
            try {
                await userService.verify(this);
                await campaignService.verify(this);
            }
            catch(e) {
            };
            running := false;
        };
    };
};
