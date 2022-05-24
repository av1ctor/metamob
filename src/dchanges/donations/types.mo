module {
    public type Donation = {
        _id: Nat32;
        pubId: Text;
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        value: Nat;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type DonationRequest = {
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        value: Nat;
    };

    public type DonationResponse = {
        _id: Nat32;
        pubId: Text;
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        value: Nat;
        createdAt: Int;
        createdBy: ?Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };    
};