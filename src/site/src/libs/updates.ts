import {Metamob, Update, Variant} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit, 
    metamob?: Metamob
): Promise<Update[]> => {
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

    const res = await metamob?.updateFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if(!res || 'err' in res) {
        throw new Error(res?.err);
    }

    return res.ok; 
};

export const findByCampaign = async (
    campaignId?: number, 
    orderBy?: Order[], 
    limit?: Limit, 
    metamob?: Metamob
): Promise<Update[]> => {
    if(!metamob || !campaignId) {
        return [];
    }

    const res = await metamob.updateFindByCampaign(
        campaignId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};

export const findById = async (
    _id?: number, 
    metamob?: Metamob
): Promise<Update> => {
    if(!metamob || !_id) {
        return {} as Update;
    }
    
    const res = await metamob.updateFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string, 
    metamob?: Metamob
): Promise<Update> => {
    if(!metamob || !pubId) {
        return {} as Update;
    }

    const res = await metamob.updateFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};