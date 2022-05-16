module {
    public type RegionKind = Nat32; 
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

    public type Region = {
        _id: Nat32;
        pubId: Text;
        parentId: ?Nat32;
        private_: Bool;
        name: Text;
        kind: RegionKind;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type RegionRequest = {
        parentId: ?Nat32;
        name: Text;
        kind: RegionKind;
        private_: Bool;
    };
};