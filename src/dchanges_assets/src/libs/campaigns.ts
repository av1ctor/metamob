import {dchanges} from "../../../declarations/dchanges";
import {Campaign, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "./common";

export enum CampaignState {
    CREATED = 0,
    CANCELED = 1,
    DELETED = 2,
    PUBLISHED = 3,
    FINISHED = 4,
    BANNED = 5,
}

export enum CampaignResult {
    NONE = 0,
    WON = 1,
    LOST = 2,
}

export const findAll = async (
    filters?: Filter, 
    orderBy?: Order, 
    limit?: Limit
): Promise<Campaign[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.campaignFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByUser = async (
    userId: number, 
    orderBy?: Order, 
    limit?: Limit
): Promise<Campaign[]> => {
    const res = await dchanges.campaignFindByUser(
        userId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    pubId: string
): Promise<Campaign> => {
    const res = await dchanges.campaignFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};