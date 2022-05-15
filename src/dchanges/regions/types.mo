module {
    public type RegionKind = Nat8; 
    public let KIND_PLANET: Nat8 = 0;
    public let KIND_CONTINENT: Nat8 = 1;
    public let KIND_COUNTRY: Nat8 = 2;
    public let KIND_STATE: Nat8 = 3;
    public let KIND_CITY: Nat8 = 4;
    public let KIND_DISTRICT: Nat8 = 5;
    public let KIND_STREET: Nat8 = 6;
    public let KIND_BUILDING: Nat8 = 7;
    public let KIND_FLOOR: Nat8 = 8;
    public let KIND_ROOM: Nat8 = 9;
    public let KIND_OTHER: Nat8 = 10;

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