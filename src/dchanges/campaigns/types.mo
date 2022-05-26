module {
    public type CampaignKind = Nat32;
    public let KIND_SIGNATURES: Nat32 = 0;
    public let KIND_VOTES: Nat32 = 1;
    public let KIND_ANON_VOTES: Nat32 = 2;
    public let KIND_WEIGHTED_VOTES: Nat32 = 3;
    public let KIND_DONATIONS: Nat32 = 4;
    
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

    public type SignatureInfo = {
        total: Nat32;
        goal: Nat32;
    };

    public type VoteInfo = {
        pro: Nat32;
        against: Nat32;
        goal: Nat32;
    };

    public type WeightedVoteInfo = {
        pro: Nat;
        against: Nat;
        goal: Nat;
    };

    public type AnonymousVoteInfo = {
        pro: Nat32;
        against: Nat32;
        goal: Nat32;
    };

    public type DonationInfo = {
        total: Nat;
        goal: Nat;
    };

    public type CampaignInfo = {
        #signatures: SignatureInfo;
        #votes: VoteInfo;
        #anonVotes: AnonymousVoteInfo;
        #weightedVotes: WeightedVoteInfo;
        #donations: DonationInfo;
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
    };
};