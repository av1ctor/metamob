import ModerationTypes "../moderations/types";

module {
    public type Role = {
        #admin;
        #moderator;
        #user;
    };

    public type Banned = Nat32;
    public let BANNED_NONE: Nat32 = 0;
    public let BANNED_AS_ADMIN: Nat32 = 1;
    public let BANNED_AS_MODERATOR: Nat32 = 2;
    public let BANNED_AS_USER: Nat32 = 4;
    
    public type Profile = {
        _id: Nat32;
        pubId: Text;
        principal: Text;
        name: Text;
        email: Text;
        avatar: ?Text;
        roles: [Role];
        active: Bool;
        country: Text;
        banned: Banned;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type ProfileRequest = {
        name: Text;
        email: Text;
        avatar: ?Text;
        roles: ?[Role];
        active: ?Bool;
        banned: ?Banned;
        country: Text;
    };

    public type ProfileResponse = {
        _id: Nat32;
        pubId: Text;
        name: Text;
        email: Text;
        avatar: ?Text;
        roles: [Role];
        country: Text;
        moderated: ModerationTypes.ModerationReason;
    };
};