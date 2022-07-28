module {
    public type ChallengeState = Nat32;
    public let STATE_VOTING: Nat32 = 0;
    public let STATE_CLOSED: Nat32 = 1;

    public type ChallengeResult = Nat32;
    public let RESULT_NONE: Nat32 = 0;
    public let RESULT_ACCEPTED: Nat32 = 1;
    public let RESULT_REFUSED: Nat32 = 2;

    public type ChallengeVote = {
        judgeId: Nat32;
        pro: Bool;
        reason: Text;
    };

    public type Challenge = {
        _id: Nat32;
        pubId: Text;
        state: ChallengeState;
        description: Text;
        moderationId: Nat32;
        judges: [Nat32];
        votes: [ChallengeVote];
        result: ChallengeResult;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
        dueAt: Int;
    };

    public type ChallengeRequest = {
        moderationId: Nat32;
        description: Text;
    };

    public type ChallengeVoteRequest = {
        pro: Bool;
        reason: Text;
    };
};