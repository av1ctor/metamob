import ModerationTypes "../moderations/types";

module {
    public type Signature = {
        _id: Nat32;
        pubId: Text;
        body: Text;
        campaignId: Nat32;
        anonymous: Bool;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type SignatureRequest = {
        campaignId: Nat32;
        body: Text;
        anonymous: Bool;
    };

    public type SignatureResponse = {
        _id: Nat32;
        pubId: Text;
        body: Text;
        campaignId: Nat32;
        anonymous: Bool;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: ?Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };    
};