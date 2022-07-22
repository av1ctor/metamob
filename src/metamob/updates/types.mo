import ModerationTypes "../moderations/types";

module {
    public type Update = {
        _id: Nat32;
        pubId: Text;
        body: Text;
        campaignId: Nat32;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type UpdateRequest = {
        campaignId: Nat32;
        body: Text;
    };
};