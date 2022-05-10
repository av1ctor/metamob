import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import UserTypes "./users/types";
import CategoryTypes "./categories/types";
import CampaignTypes "./campaigns/types";
import SignatureTypes "./signatures/types";
import UpdateTypes "./updates/types";
import UserService "./users/service";
import CategoryService "./categories/service";
import CampaignService "./campaigns/service";
import SignatureService "./signatures/service";
import UpdateService "./updates/service";

shared({caller = owner}) actor class DChanges() {

    // services
    let userService = UserService.Service();
    let categoryService = CategoryService.Service(userService);
    let campaignService = CampaignService.Service(userService);
    let signatureService = SignatureService.Service(userService, campaignService);
    let updateService = UpdateService.Service(userService, campaignService);

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
        campaignId: Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[CampaignTypes.Campaign], Text> {
        campaignService.findByCategory(campaignId, sortBy, limit);
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
    ): async Result.Result<SignatureTypes.Signature, Text> {
        signatureService.create(req, msg.caller);
    };

    public shared(msg) func signatureUpdate(
        id: Text, 
        req: SignatureTypes.SignatureRequest
    ): async Result.Result<SignatureTypes.Signature, Text> {
        signatureService.update(id, req, msg.caller);
    };

    public query func signatureFindById(
        id: Text
    ): async Result.Result<SignatureTypes.Signature, Text> {
        signatureService.findById(id);
    };

    public shared query(msg) func signatureFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.Signature], Text> {
        signatureService.find(criterias, sortBy, limit);
    };

    public query func signatureFindByCampaign(
        campaignId: Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.Signature], Text> {
        signatureService.findByCampaign(campaignId, sortBy, limit);
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
    ): async Result.Result<[SignatureTypes.Signature], Text> {
        signatureService.findByUser(userId, sortBy, limit);
    };

    public query func signatureFindByCampaignAndUser(
        campaignId: Nat32,
        userId: Nat32
    ): async Result.Result<SignatureTypes.Signature, Text> {
        signatureService.findByCampaignAndUser(campaignId, userId);
    };

    public shared(msg) func signatureDelete(
        id: Text
    ): async Result.Result<(), Text> {
        signatureService.delete(id, msg.caller);
    };    

    //
    // updates facade
    //
    public shared(msg) func updateCreate(
        req: UpdateTypes.UpdateRequest
    ): async Result.Result<UpdateTypes.Update, Text> {
        updateService.create(req, msg.caller);
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
    //
    // migration
    //
    stable var userEntities: [[(Text, Variant.Variant)]] = [];
    stable var categoryEntities: [[(Text, Variant.Variant)]] = [];
    stable var campaignEntities: [[(Text, Variant.Variant)]] = [];
    stable var signatureEntities: [[(Text, Variant.Variant)]] = [];
    stable var updateEntities: [[(Text, Variant.Variant)]] = [];

    system func preupgrade() {
        userEntities := userService.backup();
        categoryEntities := categoryService.backup();
        campaignEntities := campaignService.backup();
        signatureEntities := signatureService.backup();
        updateEntities := updateService.backup();
    };

    system func postupgrade() {
        userService.restore(userEntities);
        categoryService.restore(categoryEntities);
        campaignService.restore(campaignEntities);
        updateService.restore(updateEntities);
        userEntities := [];
        categoryEntities := [];
        campaignEntities := [];
        signatureEntities := [];
        updateEntities := [];
    };      
};
