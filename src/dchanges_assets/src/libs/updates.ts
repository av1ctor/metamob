import {dchanges} from "../../../declarations/dchanges";
import {Update, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter, 
    orderBy?: Order, 
    limit?: Limit
): Promise<Update[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.updateFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};

export const findByCampaign = async (
    campaignId: number, 
    orderBy?: Order, 
    limit?: Limit
): Promise<Update[]> => {
    const res = await dchanges.updateFindByCampaign(
        campaignId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};

export const findById = async (
    pubId: string
): Promise<Update> => {
    const res = await dchanges.updateFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};