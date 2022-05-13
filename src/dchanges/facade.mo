import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Options "mo:base/Option";
import Variant "mo:mo-table/variant";
import UserTypes "./users/types";
import CategoryTypes "./categories/types";
import CampaignTypes "./campaigns/types";
import SignatureTypes "./signatures/types";
import UpdateTypes "./updates/types";
import ReportTypes "./reports/types";
import RegionTypes "./regions/types";
import UserService "./users/service";
import CategoryService "./categories/service";
import CampaignService "./campaigns/service";
import SignatureService "./signatures/service";
import UpdateService "./updates/service";
import ReportService "./reports/service";
import RegionService "./regions/service";

shared({caller = owner}) actor class DChanges() {

    // services
    let userService = UserService.Service();
    let categoryService = CategoryService.Service(userService);
    let campaignService = CampaignService.Service(userService);
    let signatureService = SignatureService.Service(userService, campaignService);
    let updateService = UpdateService.Service(userService, campaignService);
    let reportService = ReportService.Service(userService, campaignService, signatureService, updateService);
    let regionService = RegionService.Service(userService);

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

    public query func userFindByPubId(
        pubId: Text
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.findByPubId(pubId));
    };

    public shared query(msg) func userFindMe(
    ): async Result.Result<UserTypes.ProfileResponse, Text> {
        _transformUserReponse(userService.findByPrincipal(msg.caller));
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
                #ok({
                    _id = prof._id;
                    pubId = prof.pubId;
                    name = prof.name;
                    email = prof.email;
                    avatar = prof.avatar;
                    roles = prof.roles;
                    countryId = prof.countryId;
                });
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
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CategoryTypes.Category], Text> {
        categoryService.find(criterias, sortBy, limit, msg.caller);
    };

    public query func categoryFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CategoryTypes.Category], Text> {
        categoryService.findByUser(userId, sortBy, limit);
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
        campaignService.create(req, msg.caller);
    };

    public shared(msg) func campaignUpdate(
        id: Text, 
        req: CampaignTypes.CampaignRequest
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        campaignService.update(id, req, msg.caller);
    };

    public query func campaignFindById(
        id: Text
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        campaignService.findById(id);
    };

    public shared query(msg) func campaignFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.find(criterias, sortBy, limit);
    };

    public query func campaignFindByCategory(
        categoryId: Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.findByCategory(categoryId, sortBy, limit);
    };

    public query func campaignFindByRegion(
        regionId: Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.findByRegion(regionId, sortBy, limit);
    };

    public query func campaignFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.findByUser(userId, sortBy, limit);
    };

    public shared(msg) func campaignDelete(
        id: Text
    ): async Result.Result<(), Text> {
        campaignService.delete(id, msg.caller);
    };

    //
    // signatures facade
    //
    public shared(msg) func signatureCreate(
        req: SignatureTypes.SignatureRequest
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponseEx(signatureService.create(req, msg.caller), false);
    };

    public shared(msg) func signatureUpdate(
        id: Text, 
        req: SignatureTypes.SignatureRequest
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponseEx(signatureService.update(id, req, msg.caller), false);
    };

    public query func signatureFindById(
        id: Text
    ): async Result.Result<SignatureTypes.SignatureResponse, Text> {
        _transformSignatureResponse(signatureService.findById(id));
    };

    public shared query(msg) func signatureFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.SignatureResponse], Text> {
        _transformSignatureResponses(signatureService.find(criterias, sortBy, limit));
    };

    public query func signatureFindByCampaign(
        campaignId: Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.SignatureResponse], Text> {
        _transformSignatureResponses(signatureService.findByCampaign(campaignId, sortBy, limit));
    };

    public query func signatureCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        signatureService.countByCampaign(campaignId);
    };

    public query func signatureFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.SignatureResponse], Text> {
        _transformSignatureResponses(signatureService.findByUser(userId, sortBy, limit));
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
        signatureService.delete(id, msg.caller);
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
    // updates facade
    //
    public shared(msg) func updateCreate(
        req: UpdateTypes.UpdateRequest
    ): async Result.Result<UpdateTypes.Update, Text> {
        updateService.create(req, msg.caller);
    };

    public shared(msg) func updateCreateAndFinishCampaign(
        req: UpdateTypes.UpdateRequest,
        result: CampaignTypes.CampaignResult
    ): async Result.Result<UpdateTypes.Update, Text> {
        updateService.createAndFinishCampaign(req, result, msg.caller);
    };

    public shared(msg) func updateUpdate(
        id: Text, 
        req: UpdateTypes.UpdateRequest
    ): async Result.Result<UpdateTypes.Update, Text> {
        updateService.update(id, req, msg.caller);
    };

    public query func updateFindById(
        id: Text
    ): async Result.Result<UpdateTypes.Update, Text> {
        updateService.findById(id);
    };

    public shared query(msg) func updateFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[UpdateTypes.Update], Text> {
        updateService.find(criterias, sortBy, limit);
    };

    public query func updateFindByCampaign(
        campaignId: Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[UpdateTypes.Update], Text> {
        updateService.findByCampaign(campaignId, sortBy, limit);
    };

    public query func updateCountByCampaign(
        campaignId: Nat32
    ): async Result.Result<Nat, Text> {
        updateService.countByCampaign(campaignId);
    };

    public query func updateFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[UpdateTypes.Update], Text> {
        updateService.findByUser(userId, sortBy, limit);
    };

    public shared(msg) func updateDelete(
        id: Text
    ): async Result.Result<(), Text> {
        updateService.delete(id, msg.caller);
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
        reportService.close(id, req, msg.caller);
    };

    public query func reportFindById(
        id: Text
    ): async Result.Result<ReportTypes.Report, Text> {
        reportService.findById(id);
    };

    public shared query(msg) func reportFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[ReportTypes.Report], Text> {
        reportService.find(criterias, sortBy, limit);
    };

    //
    // regions facade
    //
    public shared(msg) func regionCreate(
        req: RegionTypes.RegionRequest
    ): async Result.Result<RegionTypes.Region, Text> {
        regionService.create(req, msg.caller);
    };

    public shared(msg) func regionUpdate(
        id: Text, 
        req: RegionTypes.RegionRequest
    ): async Result.Result<RegionTypes.Region, Text> {
        regionService.update(id, req, msg.caller);
    };

    public query func regionFindById(
        _id: Nat32
    ): async Result.Result<RegionTypes.Region, Text> {
        regionService.findById(_id);
    };

    public query func regionFindByPubId(
        pubId: Text
    ): async Result.Result<RegionTypes.Region, Text> {
        regionService.findByPubId(pubId);
    };

    public shared query(msg) func regionFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[RegionTypes.Region], Text> {
        regionService.find(criterias, sortBy, limit);
    };

    //
    // migration
    //
    stable var userEntities: [[(Text, Variant.Variant)]] = [];
    stable var categoryEntities: [[(Text, Variant.Variant)]] = [];
    stable var campaignEntities: [[(Text, Variant.Variant)]] = [];
    stable var signatureEntities: [[(Text, Variant.Variant)]] = [];
    stable var updateEntities: [[(Text, Variant.Variant)]] = [];
    stable var reportEntities: [[(Text, Variant.Variant)]] = [];
    stable var regionEntities: [[(Text, Variant.Variant)]] = [];

    system func preupgrade() {
        userEntities := userService.backup();
        categoryEntities := categoryService.backup();
        campaignEntities := campaignService.backup();
        signatureEntities := signatureService.backup();
        updateEntities := updateService.backup();
        reportEntities := reportService.backup();
        regionEntities := regionService.backup();
    };

    system func postupgrade() {
        userService.restore(userEntities);
        userEntities := [];
        
        categoryService.restore(categoryEntities);
        categoryEntities := [];
        
        campaignService.restore(campaignEntities);
        campaignEntities := [];
        
        signatureService.restore(signatureEntities);
        signatureEntities := [];
        
        updateService.restore(updateEntities);
        updateEntities := [];
        
        reportService.restore(reportEntities);
        reportEntities := [];
        
        regionService.restore(regionEntities);
        regionEntities := [];
    };      
};
