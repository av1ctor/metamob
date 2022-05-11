export enum ReportState {
    CREATED = 0,
    ASSIGNED = 1,
    CLOSED = 2,
}

export enum ReportResult {
    NOTSOLVED = 0,
    SOLVED = 1,
    DUPLICATED = 2,
}

export enum ReportType {
    CAMPAIGNS = 0,
    USERS = 1,
    SIGNATURES = 2,
    UPDATES = 3,
}