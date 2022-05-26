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
    public let KIND_OTHER: Nat32 = 10;

    public type PlaceRestricted = Nat32;
    public let RESTRICTED_NO: Nat32 = 0;
    public let RESTRICTED_EMAIL: Nat32 = 1;
    public let RESTRICTED_DIP20: Nat32 = 2;
    public let RESTRICTED_DIP721: Nat32 = 3;

    public type Place = {
        _id: Nat32;
        pubId: Text;
        parentId: ?Nat32;
        kind: PlaceKind;
        restricted: PlaceRestricted;
        name: Text;
        description: Text;
        icon: Text;
        active: Bool;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type PlaceRequest = {
        parentId: ?Nat32;
        kind: PlaceKind;
        restricted: PlaceRestricted;
        name: Text;
        description: Text;
        icon: Text;
    };
};