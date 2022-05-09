module {
    public type Category = {
        _id: Nat32;
        pubId: Text;
        name: Text;
        description: Text;
        active: Bool;
        color: Text;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type CategoryRequest = {
        name: Text;
        description: Text;
        color: Text;
    };
};