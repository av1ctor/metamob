module {
    public type Donation = {
        _id: Nat32;
        pubId: Text;
        campaignId: Nat32;
        anonymous: Bool;
        value: Nat;
        createdAt: Int;
        createdBy: Nat32;
    };

    public type DonationRequest = {
        campaignId: Nat32;
        anonymous: Bool;
        value: Nat;
    };

    public type DonationResponse = {
        _id: Nat32;
        pubId: Text;
        campaignId: Nat32;
        anonymous: Bool;
        value: Nat;
        createdAt: Int;
        createdBy: ?Nat32;
    };    
};