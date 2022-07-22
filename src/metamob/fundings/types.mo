import AccountTypes "../accounts/types";
import ModerationTypes "../moderations/types";

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
        tier: Nat32;
        amount: Nat32;
        value: Nat;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type FundingRequest = {
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        tier: Nat32;
        amount: Nat32;
        value: Nat;
    };

    public type FundingResponse = {
        _id: Nat32;
        pubId: Text;
        state: FundingState;
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        tier: Nat32;
        amount: Nat32;
        value: Nat;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: ?Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };    
};