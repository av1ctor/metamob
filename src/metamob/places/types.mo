import ModerationTypes "../moderations/types";

module {
    public type PlaceKind = Nat32; 
    public let KIND_PLANET: Nat32 = 0;
    public let KIND_CONTINENT: Nat32 = 1;
    public let KIND_COUNTRY: Nat32 = 2;
    public let KIND_STATE: Nat32 = 3;
    public let KIND_CITY: Nat32 = 4;
    public let KIND_DISTRICT: Nat32 = 5;
    public let KIND_STREET: Nat32 = 6;
    public let KIND_BUILDING: Nat32 = 7;
    public let KIND_FLOOR: Nat32 = 8;
    public let KIND_ROOM: Nat32 = 9;
    public let KIND_DAO: Nat32 = 10;
    public let KIND_OTHER: Nat32 = 99;

    public let RESTRICTION_NONE: Nat32 = 0;
    public let RESTRICTION_EMAIL: Nat32 = 1;
    public let RESTRICTION_DIP20: Nat32 = 2;
    public let RESTRICTION_DIP721: Nat32 = 3;

    public type PlaceDip20Auth = {
        canisterId: Text;
        minValue: Nat;
    };

    public type PlaceDip721Auth = {
        canisterId: Text;
        minValue: Nat;
    };
    
    public type PlaceAuth = {
        #none_;
        #email;
        #dip20: PlaceDip20Auth;
        #dip721: PlaceDip721Auth;
    };

    public type Place = {
        _id: Nat32;
        pubId: Text;
        parentId: ?Nat32;
        kind: PlaceKind;
        auth: PlaceAuth;
        name: Text;
        description: Text;
        icon: Text;
        banner: ?Text;
        terms: ?Text;
        active: Bool;
        lat: Float;
        lng: Float;
        geohash: Text;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type PlaceRequest = {
        parentId: ?Nat32;
        kind: PlaceKind;
        auth: PlaceAuth;
        name: Text;
        description: Text;
        icon: Text;
        banner: ?Text;
        terms: ?Text;
        active: Bool;
        lat: Float;
        lng: Float;
    };
};