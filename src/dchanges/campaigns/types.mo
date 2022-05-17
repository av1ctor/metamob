module {
    public type CampaignState = Nat32;
    public let STATE_CREATED: Nat32 = 0;
    public let STATE_CANCELED: Nat32 = 1;
    public let STATE_DELETED: Nat32 = 2;
    public let STATE_PUBLISHED: Nat32 = 3;
    public let STATE_FINISHED: Nat32 = 4;
    public let STATE_BANNED: Nat32 = 5;

    public type CampaignResult = Nat32;
    public let RESULT_NONE: Nat32 = 0;
    public let RESULT_WON: Nat32 = 1;
    public let RESULT_LOST: Nat32 = 2;

    public type Campaign = {
        _id: Nat32;
        pubId: Text;
        title: Text;
        target: Text;
        cover: Text;
        body: Text;
        categoryId: Nat32;
        regionId: Nat32;
        state: CampaignState;
        result: CampaignResult;
        duration: Nat32;
        tags: [Text];
        signaturesCnt: Nat32;
        firstSignatureAt: ?Int;
        lastSignatureAt: ?Int;
        lastSignatureBy: ?Nat32;
        signaturers: [Nat32];
        updatesCnt: Nat32;
        publishedAt: ?Int;
        expiredAt: ?Int;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
        deletedAt: ?Int;
        deletedBy: ?Nat32;
    };

    public type CampaignRequest = {
        state: ?CampaignState;
        title: Text;
        target: Text;
        cover: Text;
        body: Text;
        categoryId: Nat32;
        regionId: Nat32;
        tags: [Text];
        duration: Nat32;
    };
};