import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Variant "mo:mo-table/variant";
import UserTypes "./users/types";
import CategoryTypes "./categories/types";
import CampaignTypes "./campaigns/types";
import SignatureTypes "./signatures/types";
import VoteTypes "./votes/types";
import DonationTypes "./donations/types";
import FundingTypes "./fundings/types";
import UpdateTypes "./updates/types";
import ReportTypes "./reports/types";
import PlaceTypes "./places/types";
import PlaceEmailTypes "./places-emails/types";
import PlaceUserTypes "./places-users/types";
import UserService "./users/service";
import CategoryService "./categories/service";
import CampaignService "./campaigns/service";
import SignatureService "./signatures/service";
import VoteService "./votes/service";
import DonationService "./donations/service";
import FundingService "./fundings/service";
import UpdateService "./updates/service";
import ReportService "./reports/service";
import PlaceService "./places/service";
import PlaceEmailService "./places-emails/service";
import PlaceUserService "./places-users/service";
import DaoService "./dao/service";
import LedgerUtils "./common/ledger";
import D "mo:base/Debug";

shared({caller = owner}) actor class Metamob(
    ledgerCanisterId: Text,
    mmtCanisterId: Text
) = this {

    // helpers
    let ledgerUtils = LedgerUtils.LedgerUtils(ledgerCanisterId);

    // services
    let daoService = DaoService.Service(mmtCanisterId);
    let userService = UserService.Service(ledgerUtils);
    let placeService = PlaceService.Service(userService);
    let placeEmailService = PlaceEmailService.Service(userService, placeService);
    let placeUserService = PlaceUserService.Service(userService, placeService);
    let categoryService = CategoryService.Service(userService);
    let campaignService = CampaignService.Service(userService, placeService, ledgerUtils);
    let signatureService = SignatureService.Service(userService, campaignService, placeService);
    let voteService = VoteService.Service(userService, campaignService, placeService);
    let donationService = DonationService.Service(userService, campaignService, placeService, ledgerUtils);
    let fundingService = FundingService.Service(userService, campaignService, placeService, ledgerUtils);
    let updateService = UpdateService.Service(userService, campaignService, placeService);
    let reportService = ReportService.Service(daoService, userService, campaignService, 
        signatureService, voteService, fundingService, donationService, updateService);

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

    public shared(msg) func campaignPublish(
        pubId: Text
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        campaignService.publish(pubId, msg.caller);
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
        _transformSignatureResponseEx(await signatureService.create(req, msg.caller, this), false);
    };

    public shared(msg) func signatureUpdate(
        id: Text, 
        req: SignatureTypes.SignatureRequest
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponseEx(await signatureService.update(id, req, msg.caller), false);
    };

    public shared query(msg) func signatureFindById(
        _id: Nat32
    ): async Result.Result<SignatureTypes.Signature, Text> {
        signatureService.findById(_id, msg.caller);
    };

    public query func signatureFindByPubId(
        pubId: Text
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponse(signatureService.findByPubId(pubId));
    };

    public shared query(msg) func signatureFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.SignatureResponse], Text> {
        _transformSignatureResponses(signatureService.find(criterias, sortBy, limit));
    };

    public query func signatureFindByCampaign(
        campaignId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.SignatureResponse], Text> {
        _transformSignatureResponses(signatureService.findByCampaign(campaignId, sortBy, limit));
    };

    public query func signatureCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        signatureService.countByCampaign(campaignId);
    };

    public shared query(msg) func signatureFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.SignatureResponse], Text> {
        _transformSignatureResponses(signatureService.findByUser(userId, sortBy, limit, msg.caller));
    };

    public query func signatureFindByCampaignAndUser(
        campaignId: Nat32,
        userId: Nat32
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponse(signatureService.findByCampaignAndUser(campaignId, userId));
    };

    public shared(msg) func signatureDelete(
        id: Text
    ): async Result.Result<(), Text> {
        await signatureService.delete(id, msg.caller);
    };

    func _redactSignatureEx(
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
                createdAt = e.createdAt;
                createdBy = null;
                updatedAt = e.updatedAt;
                updatedBy = null;
            };
        };
    };

    func _redactSignature(
        e: SignatureTypes.Signature
    ): SignatureTypes.SignatureResponse {
        _redactSignatureEx(e, true);
    };

    func _transformSignatureResponseEx(
        res: Result.Result<SignatureTypes.Signature, Text>,
        checkAnonymous: Bool
    ): Result.Result<SignatureTypes.SignatureResponse, Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(e)) {
                #ok(_redactSignatureEx(e, checkAnonymous));
            };
        };
    };

    func _transformSignatureResponse(
        res: Result.Result<SignatureTypes.Signature, Text>
    ): Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponseEx(res, true);
    };    

    func _transformSignatureResponses(
        res: Result.Result<[SignatureTypes.Signature], Text>
    ): Result.Result<[SignatureTypes.SignatureResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(entities, _redactSignature));
            };
        };
    };    

    //
    // votes facade
    //
    public shared(msg) func voteCreate(
        req: VoteTypes.VoteRequest
    ): async Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponseEx(await voteService.create(req, msg.caller, this), false);
    };

    public shared(msg) func voteUpdate(
        id: Text, 
        req: VoteTypes.VoteRequest
    ): async Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponseEx(await voteService.update(id, req, msg.caller), false);
    };

    public shared query(msg) func voteFindById(
        _id: Nat32
    ): async Result.Result<VoteTypes.Vote, Text> {
        voteService.findById(_id, msg.caller);
    };

    public query func voteFindByPubId(
        pubId: Text
    ): async Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponse(voteService.findByPubId(pubId));
    };

    public shared query(msg) func voteFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[VoteTypes.VoteResponse], Text> {
        _transformVoteResponses(voteService.find(criterias, sortBy, limit));
    };

    public query func voteFindByCampaign(
        campaignId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[VoteTypes.VoteResponse], Text> {
        _transformVoteResponses(voteService.findByCampaign(campaignId, sortBy, limit));
    };

    public query func voteCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        voteService.countByCampaign(campaignId);
    };

    public shared query(msg) func voteFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[VoteTypes.VoteResponse], Text> {
        _transformVoteResponses(voteService.findByUser(userId, sortBy, limit, msg.caller));
    };

    public query func voteFindByCampaignAndUser(
        campaignId: Nat32,
        userId: Nat32
    ): async Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponse(voteService.findByCampaignAndUser(campaignId, userId));
    };

    public shared(msg) func voteDelete(
        id: Text
    ): async Result.Result<(), Text> {
        await voteService.delete(id, msg.caller);
    };

    func _redactVoteEx(
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
                createdAt = e.createdAt;
                createdBy = null;
                updatedAt = e.updatedAt;
                updatedBy = null;
            };
        };
    };

    func _redactVote(
        e: VoteTypes.Vote
    ): VoteTypes.VoteResponse {
        _redactVoteEx(e, true);
    };

    func _transformVoteResponseEx(
        res: Result.Result<VoteTypes.Vote, Text>,
        checkAnonymous: Bool
    ): Result.Result<VoteTypes.VoteResponse, Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(e)) {
                #ok(_redactVoteEx(e, checkAnonymous));
            };
        };
    };

    func _transformVoteResponse(
        res: Result.Result<VoteTypes.Vote, Text>
    ): Result.Result<VoteTypes.VoteResponse, Text> {
        _transformVoteResponseEx(res, true);
    };    

    func _transformVoteResponses(
        res: Result.Result<[VoteTypes.Vote], Text>
    ): Result.Result<[VoteTypes.VoteResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(entities, _redactVote));
            };
        };
    };

    //
    // donations facade
    //
    public shared(msg) func donationCreate(
        req: DonationTypes.DonationRequest
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponseEx(await donationService.create(req, msg.caller), false);
    };

    public shared(msg) func donationComplete(
        pubId: Text
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponseEx(await donationService.complete(pubId, msg.caller, this), false);
    };

    public shared(msg) func donationUpdate(
        id: Text, 
        req: DonationTypes.DonationRequest
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponseEx(await donationService.update(id, req, msg.caller), false);
    };

    public shared query(msg) func donationFindById(
        _id: Nat32
    ): async Result.Result<DonationTypes.Donation, Text> {
        donationService.findById(_id, msg.caller);
    };

    public query func donationFindByPubId(
        pubId: Text
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponse(donationService.findByPubId(pubId));
    };

    public shared query(msg) func donationFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[DonationTypes.DonationResponse], Text> {
        _transformDonationResponses(donationService.find(criterias, sortBy, limit));
    };

    public query func donationFindByCampaign(
        campaignId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[DonationTypes.DonationResponse], Text> {
        _transformDonationResponses(donationService.findByCampaign(campaignId, sortBy, limit));
    };

    public query func donationCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        donationService.countByCampaign(campaignId);
    };

    public shared query(msg) func donationFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[DonationTypes.DonationResponse], Text> {
        _transformDonationResponses(donationService.findByUser(userId, sortBy, limit, msg.caller));
    };

    public query func donationFindByCampaignAndUser(
        campaignId: Nat32,
        userId: Nat32
    ): async Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponse(donationService.findByCampaignAndUser(campaignId, userId));
    };

    public shared(msg) func donationDelete(
        id: Text
    ): async Result.Result<(), Text> {
        await donationService.delete(id, msg.caller, this);
    };

    func _redactDonationEx(
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
                createdAt = e.createdAt;
                createdBy = null;
                updatedAt = e.updatedAt;
                updatedBy = null;
            };
        };
    };

    func _redactDonation(
        e: DonationTypes.Donation
    ): DonationTypes.DonationResponse {
        _redactDonationEx(e, true);
    };

    func _transformDonationResponseEx(
        res: Result.Result<DonationTypes.Donation, Text>,
        checkAnonymous: Bool
    ): Result.Result<DonationTypes.DonationResponse, Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(e)) {
                #ok(_redactDonationEx(e, checkAnonymous));
            };
        };
    };

    func _transformDonationResponse(
        res: Result.Result<DonationTypes.Donation, Text>
    ): Result.Result<DonationTypes.DonationResponse, Text> {
        _transformDonationResponseEx(res, true);
    };    

    func _transformDonationResponses(
        res: Result.Result<[DonationTypes.Donation], Text>
    ): Result.Result<[DonationTypes.DonationResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(entities, _redactDonation));
            };
        };
    };

    //
    // fundings facade
    //
    public shared(msg) func fundingCreate(
        req: FundingTypes.FundingRequest
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponseEx(await fundingService.create(req, msg.caller), false);
    };

    public shared(msg) func fundingComplete(
        pubId: Text
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponseEx(await fundingService.complete(pubId, msg.caller, this), false);
    };

    public shared(msg) func fundingUpdate(
        id: Text, 
        req: FundingTypes.FundingRequest
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponseEx(await fundingService.update(id, req, msg.caller), false);
    };

    public shared query(msg) func fundingFindById(
        _id: Nat32
    ): async Result.Result<FundingTypes.Funding, Text> {
        fundingService.findById(_id, msg.caller);
    };

    public query func fundingFindByPubId(
        pubId: Text
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponse(fundingService.findByPubId(pubId));
    };

    public shared query(msg) func fundingFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[FundingTypes.FundingResponse], Text> {
        _transformFundingResponses(fundingService.find(criterias, sortBy, limit));
    };

    public query func fundingFindByCampaign(
        campaignId: Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[FundingTypes.FundingResponse], Text> {
        _transformFundingResponses(fundingService.findByCampaign(campaignId, sortBy, limit));
    };

    public query func fundingCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        fundingService.countByCampaign(campaignId);
    };

    public shared query(msg) func fundingFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[FundingTypes.FundingResponse], Text> {
        _transformFundingResponses(fundingService.findByUser(userId, sortBy, limit, msg.caller));
    };

    public query func fundingFindByCampaignAndUser(
        campaignId: Nat32,
        userId: Nat32
    ): async Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponse(fundingService.findByCampaignAndUser(campaignId, userId));
    };

    public shared(msg) func fundingDelete(
        id: Text
    ): async Result.Result<(), Text> {
        await fundingService.delete(id, msg.caller, this);
    };

    func _redactFundingEx(
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
                createdAt = e.createdAt;
                createdBy = null;
                updatedAt = e.updatedAt;
                updatedBy = null;
            };
        };
    };

    func _redactFunding(
        e: FundingTypes.Funding
    ): FundingTypes.FundingResponse {
        _redactFundingEx(e, true);
    };

    func _transformFundingResponseEx(
        res: Result.Result<FundingTypes.Funding, Text>,
        checkAnonymous: Bool
    ): Result.Result<FundingTypes.FundingResponse, Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(e)) {
                #ok(_redactFundingEx(e, checkAnonymous));
            };
        };
    };

    func _transformFundingResponse(
        res: Result.Result<FundingTypes.Funding, Text>
    ): Result.Result<FundingTypes.FundingResponse, Text> {
        _transformFundingResponseEx(res, true);
    };    

    func _transformFundingResponses(
        res: Result.Result<[FundingTypes.Funding], Text>
    ): Result.Result<[FundingTypes.FundingResponse], Text> {
        switch(res) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(entities)) {
                #ok(Array.map(entities, _redactFunding));
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
        userId: /* Text */ Nat32,
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[UpdateTypes.Update], Text> {
        updateService.findByUser(userId, sortBy, limit, msg.caller);
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
    ): async Result.Result<ReportTypes.Report, Text> {
        reportService.create(req, msg.caller);
    };

    public shared(msg) func reportUpdate(
        id: Text, 
        req: ReportTypes.ReportRequest
    ): async Result.Result<ReportTypes.Report, Text> {
        reportService.update(id, req, msg.caller);
    };

    public shared(msg) func reportAssign(
        id: Text, 
        toUserId: Nat32
    ): async Result.Result<ReportTypes.Report, Text> {
        reportService.assign(id, toUserId, msg.caller);
    };    

    public shared(msg) func reportClose(
        id: Text, 
        req: ReportTypes.ReportCloseRequest
    ): async Result.Result<ReportTypes.Report, Text> {
        await reportService.close(id, req, msg.caller);
    };

    public shared query(msg) func reportFindById(
        id: Text
    ): async Result.Result<ReportTypes.Report, Text> {
        reportService.findById(id, msg.caller);
    };

    public shared query(msg) func reportFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?[(Text, Text)],
        limit: ?(Nat, Nat)
    ): async Result.Result<[ReportTypes.Report], Text> {
        reportService.find(criterias, sortBy, limit, msg.caller);
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
    stable var daoConfig: [(Text, Variant.Variant)] = [];
    stable var userEntities: [[(Text, Variant.Variant)]] = [];
    stable var categoryEntities: [[(Text, Variant.Variant)]] = [];
    stable var campaignEntities: [[(Text, Variant.Variant)]] = [];
    stable var signatureEntities: [[(Text, Variant.Variant)]] = [];
    stable var voteEntities: [[(Text, Variant.Variant)]] = [];
    stable var donationEntities: [[(Text, Variant.Variant)]] = [];
    stable var fundingEntities: [[(Text, Variant.Variant)]] = [];
    stable var updateEntities: [[(Text, Variant.Variant)]] = [];
    stable var reportEntities: [[(Text, Variant.Variant)]] = [];
    stable var placeEntities: [[(Text, Variant.Variant)]] = [];
    stable var placeEmailEntities: [[(Text, Variant.Variant)]] = [];
    stable var placeUserEntities: [[(Text, Variant.Variant)]] = [];

    system func preupgrade() {
        daoConfig := daoService.backup();
        userEntities := userService.backup();
        categoryEntities := categoryService.backup();
        campaignEntities := campaignService.backup();
        signatureEntities := signatureService.backup();
        voteEntities := voteService.backup();
        donationEntities := donationService.backup();
        fundingEntities := fundingService.backup();
        updateEntities := updateService.backup();
        reportEntities := reportService.backup();
        placeEntities := placeService.backup();
        placeEmailEntities := placeEmailService.backup();
        placeUserEntities := placeUserService.backup();
    };

    system func postupgrade() {
        daoService.restore(daoConfig);
        daoConfig := [];
        
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
                await campaignService.verify(this);
            }
            catch(e) {
            };
            running := false;
        };
    };
};
