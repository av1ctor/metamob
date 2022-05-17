import {dchanges} from "../../../declarations/dchanges";
import {DChanges, Update, Variant} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order, 
    limit?: Limit
): Promise<Update[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters?
        [filters.map(filter => [filter.key, filter.op, valueToVariant(filter.value)])]:
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
    _id: number, 
    main: DChanges
): Promise<Update> => {
    const res = await main.updateFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId: string
): Promise<Update> => {
    const res = await dchanges.updateFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};