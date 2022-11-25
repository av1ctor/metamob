import Variant "mo:mo-table/variant";
import ModerationTypes "../moderations/types";

module {
    public let REFUND_TAX: Nat64 = 10; // 10%
    public let DONATIONS_TAX: Nat64 = 10; // 10%
    public let FUNDING_TAX: Nat64 = 20; // 20%
    public let MIN_WITHDRAW_VALUE: Nat64 = 20_000; // ledger's fee * 2
    
    public type CampaignKind = Nat32;
    public let KIND_SIGNATURES: Nat32 = 0;
    public let KIND_VOTES: Nat32 = 1;
    public let KIND_WEIGHTED_VOTES: Nat32 = 2;
    public let KIND_FUNDING: Nat32 = 3;
    public let KIND_DONATIONS: Nat32 = 4;
    
    public type CampaignState = Nat32;
    public let STATE_CREATED: Nat32 = 0;
    public let STATE_CANCELED: Nat32 = 1;
    public let STATE_DELETED: Nat32 = 2;
    public let STATE_PUBLISHED: Nat32 = 3;
    public let STATE_FINISHED: Nat32 = 4;
    public let STATE_BUILDING: Nat32 = 5;

    public type CampaignResult = Nat32;
    public let RESULT_NONE: Nat32 = 0;
    public let RESULT_OK: Nat32 = 1;
    public let RESULT_NOK: Nat32 = 2;

    public let ACTION_NOP: Nat32 = 0;
    public let ACTION_TRANSFER_FUNDS: Nat32 = 1;
    public let ACTION_INVOKE_METHOD: Nat32 = 2;

    public type SignatureInfo = {
    };

    public type VoteInfo = {
        pro: Nat;
        against: Nat;
    };

    public type DonationInfo = {
    };

    public type FundingTier = {
        title: Text;
        desc: Text;
        total: Nat32;
        max: Nat32; 
        value: Nat;
    };

    public type FundingInfo = {
        tiers: [FundingTier];
    };

    public type CampaignInfo = {
        #signatures: SignatureInfo;
        #votes: VoteInfo;
        #funding: FundingInfo;
        #donations: DonationInfo;
    };

    public type CampaignTransferFundsAction = {
        receiver: Text;
    };

    public type CampaignInvokeMethodAction = {
        canisterId: Text;
        method: Text;
        args: [Variant.MapEntry];
    };

    public type CampaignAction = {
        #nop;
        #transfer: CampaignTransferFundsAction;
        #invoke: CampaignInvokeMethodAction;
    };
    
    public type Campaign = {
        _id: Nat32;
        pubId: Text;
        kind: CampaignKind;
        title: Text;
        target: Text;
        cover: Text;
        body: Text;
        categoryId: Nat32;
        placeId: Nat32;
        state: CampaignState;
        result: CampaignResult;
        duration: Nat32;
        tags: [Text];
        info: CampaignInfo;
        goal: Nat;
        total: Nat;
        interactions: Nat32;
        boosting: Nat;
        updates: Nat32;
        action: CampaignAction;
        moderated: ModerationTypes.ModerationReason;
        publishedAt: ?Int;
        expiredAt: ?Int;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type CampaignRequest = {
        kind: CampaignKind;
        state: ?CampaignState;
        title: Text;
        target: Text;
        cover: Text;
        body: Text;
        categoryId: Nat32;
        placeId: Nat32;
        tags: [Text];
        duration: Nat32;
        goal: Nat;
        action: CampaignAction;
        info: CampaignInfo;
    };
};