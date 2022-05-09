module {
    public type Signature = {
        _id: Nat32;
        pubId: Text;
        body: Text;
        campaignId: Nat32;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type SignatureRequest = {
        campaignId: Nat32;
        body: Text;
    };
};