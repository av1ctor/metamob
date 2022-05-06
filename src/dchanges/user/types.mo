module {
    public type Role = {
        #admin;
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
        countryId: Nat32;
        banned: Bool;
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
        countryId: Nat32;
    };

    public type ProfileResponse = {
        _id: Nat32;
        pubId: Text;
        name: Text;
        email: Text;
        avatar: ?Text;
        roles: [Role];
        countryId: Nat32;
    };
};