import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import UserTypes "./user/types";
import CategoryTypes "./category/types";
import PetitionTypes "./petition/types";
import SignatureTypes "./signature/types";
import TagTypes "./tag/types";
import UserService "./user/service";
import CategoryService "./category/service";
import PetitionService "./petition/service";
import SignatureService "./signature/service";
import TagService "./tag/service";

shared({caller = owner}) actor class DChanges() {

    // services
    let userService = UserService.Service();
    let categoryService = CategoryService.Service(userService);
    let petitionService = PetitionService.Service(userService);
    let signatureService = SignatureService.Service(userService, petitionService);
    let tagService = TagService.Service(userService);

    //
    // users facade
    //
    public shared(msg) func userCreate(
        req: UserTypes.ProfileRequest
    ): async Result.Result<UserTypes.Profile, Text> {
        userService.create(req, msg.caller, owner);
    };

    public shared(msg) func userUpdateMe(
        req: UserTypes.ProfileRequest
    ): async Result.Result<UserTypes.Profile, Text> {
        userService.updateMe(req, msg.caller);
    };

    public shared(msg) func userUpdate(
        id: Text, 
        req: UserTypes.ProfileRequest
    ): async Result.Result<UserTypes.Profile, Text> {
        userService.update(id, req, msg.caller);
    };

    public query func userFindById(
        _id: Nat32
    ): async Result.Result<UserTypes.Profile, Text> {
        userService.findById(_id);
    };

    public query func userFindByPubId(
        pubId: Text
    ): async Result.Result<UserTypes.Profile, Text> {
        userService.findByPubId(pubId);
    };

    public shared query(msg) func userFindMe(
    ): async Result.Result<UserTypes.Profile, Text> {
        userService.findByPubId(Principal.toText(msg.caller));
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
    // petitions facade
    //
    public shared(msg) func petitionCreate(
        req: PetitionTypes.PetitionRequest
    ): async Result.Result<PetitionTypes.Petition, Text> {
        petitionService.create(req, msg.caller);
    };

    public shared(msg) func petitionUpdate(
        id: Text, 
        req: PetitionTypes.PetitionRequest
    ): async Result.Result<PetitionTypes.Petition, Text> {
        petitionService.update(id, req, msg.caller);
    };

    public query func petitionFindById(
        id: Text
    ): async Result.Result<PetitionTypes.Petition, Text> {
        petitionService.findById(id);
    };

    public shared query(msg) func petitionFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[PetitionTypes.Petition], Text> {
        petitionService.find(criterias, sortBy, limit);
    };

    public query func petitionFindByCategory(
        petitionId: Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[PetitionTypes.Petition], Text> {
        petitionService.findByCategory(petitionId, sortBy, limit);
    };

    public query func petitionFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[PetitionTypes.Petition], Text> {
        petitionService.findByUser(userId, sortBy, limit);
    };

    public shared(msg) func petitionDelete(
        id: Text
    ): async Result.Result<(), Text> {
        petitionService.delete(id, msg.caller);
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

    public query func signatureFindByPetition(
        petitionId: Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.Signature], Text> {
        signatureService.findByPetition(petitionId, sortBy, limit);
    };

    public query func signatureCountByPetition(
        petitionId: Nat32
    ): async Result.Result<Nat, Text> {
        signatureService.countByPetition(petitionId);
    };

    public query func signatureFindByUser(
        userId: /* Text */ Nat32,
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[SignatureTypes.Signature], Text> {
        signatureService.findByUser(userId, sortBy, limit);
    };

    public shared(msg) func signatureDelete(
        id: Text
    ): async Result.Result<(), Text> {
        signatureService.delete(id, msg.caller);
    };    

    //
    // tags facade
    //
    public shared(msg) func tagCreate(
        req: TagTypes.TagRequest
    ): async Result.Result<TagTypes.Tag, Text> {
        tagService.create(req, msg.caller);
    };

    public shared(msg) func tagUpdate(
        id: Text, 
        req: TagTypes.TagRequest
    ): async Result.Result<TagTypes.Tag, Text> {
        tagService.update(id, req, msg.caller);
    };

    public query func tagFindById(
        _id: Nat32
    ): async Result.Result<TagTypes.Tag, Text> {
        tagService.findById(_id);
    };

    public shared query(msg) func tagFind(
        criterias: ?[(Text, Text, Variant.Variant)],
        sortBy: ?(Text, Text),
        limit: ?(Nat, Nat)
    ): async Result.Result<[TagTypes.Tag], Text> {
        tagService.find(criterias, sortBy, limit, msg.caller);
    };

    public shared(msg) func tagDelete(
        id: Text
    ): async Result.Result<(), Text> {
        tagService.delete(id, msg.caller);
    };

    //
    // migration
    //
    stable var userEntities: [[(Text, Variant.Variant)]] = [];
    stable var categoryEntities: [[(Text, Variant.Variant)]] = [];
    stable var tagEntities: [[(Text, Variant.Variant)]] = [];
    stable var petitionEntities: [[(Text, Variant.Variant)]] = [];
    stable var signatureEntities: [[(Text, Variant.Variant)]] = [];

    system func preupgrade() {
        userEntities := userService.backup();
        categoryEntities := categoryService.backup();
        tagEntities := tagService.backup();
        petitionEntities := petitionService.backup();
        signatureEntities := signatureService.backup();
    };

    system func postupgrade() {
        userService.restore(userEntities);
        categoryService.restore(categoryEntities);
        tagService.restore(tagEntities);
        petitionService.restore(petitionEntities);
        signatureService.restore(signatureEntities);
        userEntities := [];
        categoryEntities := [];
        tagEntities := [];
        petitionEntities := [];
        signatureEntities := [];
    };      
};
