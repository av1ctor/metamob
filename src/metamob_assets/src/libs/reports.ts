import {Metamob, Report, Variant} from "../../../declarations/metamob/metamob.did";
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
    VOTES = 4,
    DONATIONS = 5,
    FUNDINGS = 6,
}

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
        default:
            return 'Unknown';
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
            return 'Fundings';
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