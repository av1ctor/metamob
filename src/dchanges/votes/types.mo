module {
    public type Vote = {
        _id: Nat32;
        pubId: Text;
        campaignId: Nat32;
        anonymous: Bool;
        value: Int;
        weight: Nat;
        createdAt: Int;
        createdBy: Nat32;
    };

    public type VoteRequest = {
        campaignId: Nat32;
        anonymous: Bool;
        value: Int;
    };

    public type VoteResponse = {
        _id: Nat32;
        pubId: Text;
        campaignId: Nat32;
        anonymous: Bool;
        value: Int;
        weight: Nat;
        createdAt: Int;
        createdBy: ?Nat32;
    };    
};