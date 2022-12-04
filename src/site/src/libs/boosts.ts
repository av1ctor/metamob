import {metamob} from "../../../declarations/metamob";
import {Variant, BoostResponse, Boost, Metamob} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum BoostState {
    CREATED,
    COMPLETED,
};

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit
): Promise<BoostResponse[]> => {
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

    const res = await metamob.boostFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaign = async (
    boostId?: number, 
    orderBy?: Order[], 
    limit?: Limit
): Promise<BoostResponse[]> => {
    if(!boostId) {
        return [];
    }
    
    const res = await metamob.boostFindByCampaign(
        boostId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaignAndUser = async (
    boostId?: number, 
    userId?: number
): Promise<BoostResponse> => {
    if(!boostId || !userId) {
        return {} as BoostResponse;
    }
    
    const res = await metamob.boostFindByCampaignAndUser(
        boostId, 
        userId);
    
    if('err' in res) {
        if(res.err === 'Not found') {
            return {} as BoostResponse;
        }
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByUser = async (
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<BoostResponse[]> => {
    if(!metamob) {
        return [];
    }   

    const res = await metamob.boostFindByUser(
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    _id?: number, 
    metamob?: Metamob
): Promise<Boost> => {
    if(!metamob || !_id) {
        return {} as Boost;
    }
        
    const res = await metamob.boostFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string
): Promise<BoostResponse> => {
    if(!pubId) {
        return {} as BoostResponse;
    }

    const res = await metamob.boostFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};