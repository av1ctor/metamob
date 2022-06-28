module {
    public type Role = {
        #admin;
        #moderator;
        #user;
    };
    
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
        banned: Bool;
        bannedAsMod: Bool;
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
        banned: ?Bool;
        bannedAsMod: ?Bool;
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
    };
};