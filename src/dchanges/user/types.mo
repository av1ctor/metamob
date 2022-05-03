module {
    public type Role = {
        #admin;
        #user;
    };
    
    public type Profile = {
        _id: Nat32;
        pubId: Text;
        name: Text;
        avatar: ?Text;
        roles: [Role];
        active: Bool;
        banned: Bool;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type ProfileRequest = {
        name: Text;
        avatar: ?Text;
        roles: ?[Role];
        active: ?Bool;
        banned: ?Bool;
    };
};