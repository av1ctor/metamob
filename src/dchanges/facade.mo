import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import UserTypes "./user/types";
import CategoryTypes "./category/types";
import PetitionTypes "./petition/types";
import CommentTypes "./comment/types";
import TagTypes "./tag/types";
import UserService "./user/service";
import CategoryService "./category/service";
import PetitionService "./petition/service";
import CommentService "./comment/service";
import TagService "./tag/service";

shared({caller = owner}) actor class DChanges() {

    // services
    let userService = UserService.Service();
    let categoryService = CategoryService.Service(userService);
    let petitionService = PetitionService.Service(userService);
    let commentService = CommentService.Service(userService, petitionService);
    let tagService = TagService.Service(userService);

    // users facade
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

};
