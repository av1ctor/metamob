import EntityTypes "../common/entities";

module {
    public type ReportState = Nat32;
    public let STATE_CREATED: Nat32 = 0;
    public let STATE_ASSIGNED: Nat32 = 1;
    public let STATE_CLOSED: Nat32 = 2;
    public let STATE_MODERATING: Nat32 = 3;
    
    public type ReportResult = Nat32;
    public let RESULT_VERIFYING: Nat32 = 0;
    public let RESULT_MODERATED: Nat32 = 1;
    public let RESULT_DUPLICATED: Nat32 = 2;
    public let RESULT_IGNORED: Nat32 = 3;

    public type ReportKind = Nat32;
    public let KIND_FAKE: Nat32 = 0;
    public let KIND_NUDITY: Nat32 = 1;
    public let KIND_HATE: Nat32 = 2;
    public let KIND_SPAM: Nat32 = 3;
    public let KIND_CONFIDENTIAL: Nat32 = 4;
    public let KIND_COPYRIGHT: Nat32 = 5;
    public let KIND_OTHER: Nat32 = 99;

    public type Report = {
        _id: Nat32;
        pubId: Text;
        state: ReportState;
        result: ReportResult;
        entityType: EntityTypes.EntityType;
        entityId: Nat32;
        entityPubId: Text;
        entityCreatedBy: Nat32;
        kind: ReportKind;
        description: Text;
        resolution: Text;
        moderationId: ?Nat32;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
        assignedAt: Int;
        assignedTo: Nat32;
    };

    public type ReportRequest = {
        entityType: EntityTypes.EntityType;
        entityId: Nat32;
        entityPubId: Text;
        kind: ReportKind;
        description: Text;
    };

    public type ReportCloseRequest = {
        result: ReportResult;
        resolution: Text;
    };

    public type ReportResponse = {
        _id: Nat32;
        pubId: Text;
        state: ReportState;
        result: ReportResult;
        entityType: EntityTypes.EntityType;
        entityId: Nat32;
        entityPubId: Text;
        entityCreatedBy: Nat32;
        kind: ReportKind;
        description: Text;
        resolution: Text;
        createdAt: Int;
        createdBy: ?Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
        assignedAt: Int;
        assignedTo: Nat32;
    };
};