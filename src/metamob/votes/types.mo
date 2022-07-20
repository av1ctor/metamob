import ModerationTypes "../moderations/types";

module {
    public type Vote = {
        _id: Nat32;
        pubId: Text;
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        pro: Bool;
        weight: Nat;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type VoteRequest = {
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        pro: Bool;
    };

    public type VoteResponse = {
        _id: Nat32;
        pubId: Text;
        campaignId: Nat32;
        anonymous: Bool;
        body: Text;
        pro: Bool;
        weight: Nat;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: ?Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };    
};