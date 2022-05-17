import {DChanges, Report, Variant} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum ReportState {
    CREATED = 0,
    ASSIGNED = 1,
    CLOSED = 2,
}

export enum ReportResult {
    VERIFYING = 0,
    SOLVED = 1,
    DUPLICATED = 2,
}

export enum ReportType {
    CAMPAIGNS = 0,
    USERS = 1,
    SIGNATURES = 2,
    UPDATES = 3,
}

export const entityTypeToText = (
    type: ReportType
): string => {
    switch(type) {
        case ReportType.CAMPAIGNS:
            return 'Campaign';
        case ReportType.SIGNATURES:
            return 'Signature';
        case ReportType.UPDATES:
            return 'Update';
        case ReportType.USERS:
            return 'User';
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
        case ReportType.UPDATES:
            return 'warning';
        case ReportType.USERS:
            return 'dark';
        default:
            return 'black';
    }
};

export const findAll = async (
    main: DChanges,
    filters?: Filter[], 
    orderBy?: Order, 
    limit?: Limit,
): Promise<Report[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters?
        [filters.map(filter => [filter.key, filter.op, valueToVariant(filter.value)])]:
        [];

    const res = await main.reportFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    main: DChanges,
    pubId: string
): Promise<Report> => {
    const res = await main.reportFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};