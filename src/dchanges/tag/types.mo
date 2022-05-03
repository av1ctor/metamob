module {
    public type Tag = {
        _id: Nat32;
        pubId: Text;
        name: Text;
        color: Text;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type TagRequest = {
        name: Text;
        color: Text;
    };
};