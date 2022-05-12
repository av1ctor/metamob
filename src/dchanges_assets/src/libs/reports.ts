import {dchanges} from "../../../declarations/dchanges";
import {Report, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "./common";

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

export const findAll = async (
    filters?: Filter, 
    orderBy?: 
    Order, limit?: Limit
): Promise<Report[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.reportFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    pubId: string
): Promise<Report> => {
    const res = await dchanges.reportFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};