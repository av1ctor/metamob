import AccountTypes "../accounts/types";

module {
    public type DonationState = Nat32;
    public let STATE_CREATED: Nat32 = 0;
    public let STATE_COMPLETED: Nat32 = 1;

    public type Donation = {
        _id: Nat32;
        pubId: Text;
        state: DonationState;
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
        state: DonationState;
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