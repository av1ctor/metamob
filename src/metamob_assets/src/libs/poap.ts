import {metamob} from "../../../declarations/metamob";
import {Variant, Poap, Metamob} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export const POAP_DEPLOYING_PRICE = BigInt(10_00000000);

export enum PoapState {
    MINTING,
    PAUSED,
    CANCELLED,
    ENDED
};

export enum PoapOption {
    NONE,
}

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit
): Promise<Poap[]> => {
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

    const res = await metamob.poapFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaign = async (
    poapId?: number, 
    orderBy?: Order[], 
    limit?: Limit
): Promise<Poap[]> => {
    if(!poapId) {
        return [];
    }
    
    const res = await metamob.poapFindByCampaign(
        poapId, 
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
): Promise<Poap[]> => {
    if(!main) {
        return [];
    }   

    const res = await main.poapFindByUser(
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    _id?: number, 
    main?: Metamob
): Promise<Poap> => {
    if(!main || !_id) {
        return {} as Poap;
    }
        
    const res = await main.poapFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string
): Promise<Poap> => {
    if(!pubId) {
        return {} as Poap;
    }

    const res = await metamob.poapFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};