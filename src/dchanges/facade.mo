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
import PlaceTypes "./places/types";
import UserService "./users/service";
import CategoryService "./categories/service";
import CampaignService "./campaigns/service";
import SignatureService "./signatures/service";
import UpdateService "./updates/service";
import ReportService "./reports/service";
import PlaceService "./places/service";

shared({caller = owner}) actor class DChanges() {

    // services
    let userService = UserService.Service();
    let categoryService = CategoryService.Service(userService);
    let campaignService = CampaignService.Service(userService);
    let signatureService = SignatureService.Service(userService, campaignService);
    let updateService = UpdateService.Service(userService, campaignService);
    let reportService = ReportService.Service(userService, campaignService, signatureService, updateService);
    let placeService = PlaceService.Service(userService);

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
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[UserTypes.Profile], Text> {
        userService.find(criterias, sortBy, limit, msg.caller);
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
            countryId = prof.countryId;
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
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CategoryTypes.Category], Text> {
        categoryService.find(criterias, sortBy, limit, msg.caller);
    };

    public shared query(msg) func categoryFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
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
        campaignService.create(req, msg.caller);
    };

    public shared(msg) func campaignUpdate(
        id: Text, 
        req: CampaignTypes.CampaignRequest
    ): async Result.Result<CampaignTypes.Campaign, Text> {
        campaignService.update(id, req, msg.caller);
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

    public query func campaignFindByPlace(
        placeId: Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.findByPlace(placeId, sortBy, limit);
    };

    public shared query(msg) func campaignFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.findByUser(userId, sortBy, limit, msg.caller);
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

    public shared query(msg) func signatureFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
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

    public shared query(msg) func updateFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[UpdateTypes.Update], Text> {
        updateService.findByUser(userId, sortBy, limit, msg.caller);
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

    public shared query(msg) func reportFindById(
        id: Text
    ): async Result.Result<ReportTypes.Report, Text> {
        reportService.findById(id, msg.caller);
    };

    public shared query(msg) func reportFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
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
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[PlaceTypes.Place], Text> {
        placeService.findByUser(userId, sortBy, limit, msg.caller);
    };

    public shared query(msg) func placeFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[PlaceTypes.Place], Text> {
        placeService.find(criterias, sortBy, limit);
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
    stable var placeEntities: [[(Text, Variant.Variant)]] = [];

    system func preupgrade() {
        userEntities := userService.backup();
        categoryEntities := categoryService.backup();
        campaignEntities := campaignService.backup();
        signatureEntities := signatureService.backup();
        updateEntities := updateService.backup();
        reportEntities := reportService.backup();
        placeEntities := placeService.backup();
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
        
        placeService.restore(placeEntities);
        placeEntities := [];
    };      
};
