module {
    public type ReportState = Nat8;
    public let STATE_CREATED: Nat8 = 0;
    public let STATE_ASSIGNED: Nat8 = 1;
    public let STATE_CLOSED: Nat8 = 2;
    
    public type ReportResult = Nat8;
    public let RESULT_NOTSOLVED: Nat8 = 0;
    public let RESULT_SOLVED: Nat8 = 1;
    public let RESULT_DUPLICATED: Nat8 = 2;

    public type ReportType = Nat8;
    public let TYPE_CAMPAIGNS: Nat8 = 0;
    public let TYPE_USERS: Nat8 = 1;
    public let TYPE_SIGNATURES: Nat8 = 2;
    public let TYPE_UPDATES: Nat8 = 3;

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