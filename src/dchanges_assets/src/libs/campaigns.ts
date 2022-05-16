import {dchanges} from "../../../declarations/dchanges";
import {Campaign, Variant} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
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
    filters?: Filter[], 
    orderBy?: Order, 
    limit?: Limit
): Promise<Campaign[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters?
        [filters.filter(filter => !!filter.value).map(filter => [filter.key, filter.op, valueToVariant(filter.value)])]:
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
    _id: number
): Promise<Campaign> => {
    const res = await dchanges.campaignFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId: string
): Promise<Campaign> => {
    const res = await dchanges.campaignFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};