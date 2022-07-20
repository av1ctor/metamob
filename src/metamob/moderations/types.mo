import EntityTypes "../common/entities";

module {
    public type ModerationState = Nat32;
    public let STATE_CREATED: Nat32 = 0;
    public let STATE_CHALLENGED: Nat32 = 1;
    public let STATE_CONFIRMED: Nat32 = 2;
    public let STATE_REVERTED: Nat32 = 3;
    
    public type ModerationReason = Nat32;
    public let REASON_NONE: Nat32 = 0;
    public let REASON_FAKE: Nat32 = 1;
    public let REASON_NUDITY: Nat32 = 2;
    public let REASON_HATE: Nat32 = 4;
    public let REASON_SPAM: Nat32 = 8;
    public let REASON_CONFIDENTIAL: Nat32 = 16;
    public let REASON_COPYRIGHT: Nat32 = 32;
    public let REASON_OFFENSIVE: Nat32 = 64;
    public let REASON_OTHER: Nat32 = 65536;

    public type ModerationAction = Nat32;
    public let ACTION_FLAGGED: Nat32 = 1;
    public let ACTION_REDACTED: Nat32 = 2;

    public type Moderation = {
        _id: Nat32;
        pubId: Text;
        state: ModerationState;
        reason: ModerationReason;
        action: ModerationAction;
        body: Text;
        reportId: Nat32;
        entityType: EntityTypes.EntityType;
        entityId: Nat32;
        challengeId: ?Nat32;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type ModerationRequest = {
        reportId: Nat32;
        reason: ModerationReason;
        action: ModerationAction;
        body: Text;
    };
};