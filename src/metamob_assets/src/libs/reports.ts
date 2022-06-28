import {Metamob, Report, Variant} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum ReportState {
    CREATED = 0,
    ASSIGNED = 1,
    CLOSED = 2,
    CHALLENGED = 3,
}

export enum ReportResult {
    VERIFYING = 0,
    SOLVED = 1,
    DUPLICATED = 2,
    IGNORED = 3,
}

export enum ReportType {
    CAMPAIGNS = 0,
    USERS = 1,
    SIGNATURES = 2,
    UPDATES = 3,
    VOTES = 4,
    DONATIONS = 5,
    FUNDINGS = 6,
    PLACES = 7,
}

export enum ReportKind {
    FAKE = 0,
    NUDITY = 1,
    HATE = 2,
    SPAM = 3,
    CONFIDENTIAL = 4,
    COPYRIGHT = 5,
    OTHER = 99,
}

export const kinds: {name: string, value: any}[] = [
    {name: 'Fake or fraudulent', value: ReportKind.FAKE},
    {name: 'Contains nudity', value: ReportKind.NUDITY},
    {name: 'Promotes hate, violence or illegal/offensive activities', value: ReportKind.HATE},
    {name: 'Spam, malware or "phishing" (fake login)', value: ReportKind.SPAM},
    {name: 'Private or confidential information', value: ReportKind.CONFIDENTIAL},
    {name: 'Copyright infringement', value: ReportKind.COPYRIGHT},
    {name: 'Other', value: ReportKind.OTHER},
];

export const reportStateToText = (
    state: ReportState
): string => {
    switch(state) {
        case ReportState.CREATED:
            return 'Created';
        case ReportState.ASSIGNED:
            return 'Assigned';
        case ReportState.CLOSED:
            return 'Closed';
        case ReportState.CHALLENGED:
            return 'Challenged';
        default:
            return 'Unknown';
    }
};

export const reportStateToColor = (
    state: ReportState
): string => {
    switch(state) {
        case ReportState.CREATED:
            return 'dark';
        case ReportState.ASSIGNED:
            return 'warning';
        case ReportState.CLOSED:
            return 'success';
        case ReportState.CHALLENGED:
            return 'danger';
        default:
            return 'black';
    }
};

export const reportResultToText = (
    result: ReportResult
): string => {
    switch(result) {
        case ReportResult.VERIFYING:
            return 'Verifying';
        case ReportResult.IGNORED:
            return 'Ignored';
        case ReportResult.DUPLICATED:
            return 'Duplicated';
        case ReportResult.SOLVED:
            return 'Solved';
        default:
            return 'Unknown';
    }
};

export const reportResultToColor = (
    result: ReportResult
): string => {
    switch(result) {
        case ReportResult.VERIFYING:
            return 'warning';
        case ReportResult.IGNORED:
            return 'danger';
        case ReportResult.DUPLICATED:
            return 'danger';
        case ReportResult.SOLVED:
            return 'success';
        default:
            return 'black';
    }
};

export const entityTypeToText = (
    type: ReportType
): string => {
    switch(type) {
        case ReportType.CAMPAIGNS:
            return 'Campaign';
        case ReportType.SIGNATURES:
            return 'Signature';
        case ReportType.VOTES:
            return 'Vote';
        case ReportType.DONATIONS:
            return 'Donation';
        case ReportType.FUNDINGS:
            return 'Fundraising';
        case ReportType.UPDATES:
            return 'Update';
        case ReportType.USERS:
            return 'User';
        case ReportType.PLACES:
            return 'Place';
        default:
            return 'Unknown';
    }
};

export const entityTypeToColor = (
    type: ReportType
): string => {
    switch(type) {
        case ReportType.CAMPAIGNS:
            return 'success';
        case ReportType.SIGNATURES:
            return 'danger';
        case ReportType.VOTES:
            return 'danger';
        case ReportType.DONATIONS:
            return 'danger';
        case ReportType.FUNDINGS:
            return 'danger';
        case ReportType.UPDATES:
            return 'warning';
        case ReportType.USERS:
            return 'dark';
        case ReportType.PLACES:
            return 'primary';
        default:
            return 'black';
    }
};

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit,
    main?: Metamob
): Promise<Report[]> => {
    if(!main) {
        return [];
    }

    const criterias: [] | [Array<[string, string, Variant]>] = filters?
        [
            filters
                .filter(filter => filter.value !== null && filter.value !== '')
                .map(filter => [
                    filter.key, 
                    filter.op, 
                    valueToVariant(filter.value)
                ])
        ]:
        [];

    const res = await main.reportFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByUser = async (
    orderBy?: Order[], 
    limit?: Limit,
    main?: Metamob
): Promise<Report[]> => {
    if(!main) {
        return [];
    }

    const res = await main.reportFindByUser(
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    pubId?: string,
    main?: Metamob
): Promise<Report> => {
    if(!main || !pubId) {
        return {} as Report;
    }

    const res = await main.reportFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};