module {
    public type Signature = {
        _id: Nat32;
        pubId: Text;
        body: Text;
        petitionId: Nat32;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type SignatureRequest = {
        petitionId: Nat32;
        body: Text;
    };
};