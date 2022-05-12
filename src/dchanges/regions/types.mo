module {
    public type Region = {
        _id: Nat32;
        pubId: Text;
        parentId: ?Nat32;
        private_: Bool;
        name: Text;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type RegionRequest = {
        parentId: ?Nat32;
        name: Text;
        private_: Bool;
    };
};