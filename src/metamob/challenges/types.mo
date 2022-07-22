module {
    public type Challenge = {
        _id: Nat32;
        pubId: Text;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };
};