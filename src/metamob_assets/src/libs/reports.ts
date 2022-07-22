import {Metamob, ReportResponse, Variant} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum ReportState {
    CREATED = 0,
    ASSIGNED = 1,
    CLOSED = 2,
    MODERATING = 3,
}

export enum ReportResult {
    VERIFYING = 0,
    MODERATED = 1,
    DUPLICATED = 2,
    IGNORED = 3,
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
        case ReportState.MODERATING:
            return 'Moderating';
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
        case ReportState.MODERATING:
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
        case ReportResult.MODERATED:
            return 'Moderated';
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
        case ReportResult.MODERATED:
            return 'success';
        default:
            return 'black';
    }
};

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit,
    main?: Metamob
): Promise<ReportResponse[]> => {
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
): Promise<ReportResponse[]> => {
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

export const findByReportedUser = async (
    orderBy?: Order[], 
    limit?: Limit,
    main?: Metamob
): Promise<ReportResponse[]> => {
    if(!main) {
        return [];
    }

    const res = await main.reportFindByReportedUser(
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
): Promise<ReportResponse> => {
    if(!main || !pubId) {
        return {} as ReportResponse;
    }

    const res = await main.reportFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};