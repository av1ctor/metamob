import AccountTypes "../accounts/types";

module {
    public type FundingState = Nat32;
    public let STATE_CREATED: Nat32 = 0;
    public let STATE_COMPLETED: Nat32 = 1;

    public type Funding = {
        _id: Nat32;
        pubId: Text;
        state: FundingState;
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        value: Nat;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type FundingRequest = {
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        value: Nat;
    };

    public type FundingResponse = {
        _id: Nat32;
        pubId: Text;
        state: FundingState;
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