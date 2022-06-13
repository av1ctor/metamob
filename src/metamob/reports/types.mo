module {
    public type ReportState = Nat32;
    public let STATE_CREATED: Nat32 = 0;
    public let STATE_ASSIGNED: Nat32 = 1;
    public let STATE_CLOSED: Nat32 = 2;
    
    public type ReportResult = Nat32;
    public let RESULT_VERIFYING: Nat32 = 0;
    public let RESULT_SOLVED: Nat32 = 1;
    public let RESULT_DUPLICATED: Nat32 = 2;
    public let RESULT_IGNORED: Nat32 = 3;

    public type ReportType = Nat32;
    public let TYPE_CAMPAIGNS: Nat32 = 0;
    public let TYPE_USERS: Nat32 = 1;
    public let TYPE_SIGNATURES: Nat32 = 2;
    public let TYPE_UPDATES: Nat32 = 3;
    public let TYPE_VOTES: Nat32 = 4;
    public let TYPE_DONATIONS: Nat32 = 5;
    public let TYPE_FUNDINGS: Nat32 = 6;

    public type Report = {
        _id: Nat32;
        pubId: Text;
        state: ReportState;
        result: ReportResult;
        entityType: ReportType;
        entityId: Nat32;
        description: Text;
        resolution: Text;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
        assignedAt: ?Int;
        assignedTo: ?Nat32;
    };

    public type ReportRequest = {
        entityType: ReportType;
        entityId: Nat32;
        description: Text;
    };

    public type ReportCloseRequest = {
        result: ReportResult;
        resolution: Text;
    };
};