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
    limit?: Limit, 
    metamob?: Metamob
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

    const res = await metamob?.poapFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if(!res || 'err' in res) {
        throw new Error(res?.err);
    }

    return res.ok; 
}

export const findByCampaign = async (
    poapId?: number, 
    orderBy?: Order[], 
    limit?: Limit, 
    metamob?: Metamob
): Promise<Poap[]> => {
    if(!metamob || !poapId) {
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
    metamob?: Metamob
): Promise<Poap[]> => {
    if(!metamob) {
        return [];
    }   

    const res = await metamob.poapFindByUser(
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
): Promise<Poap> => {
    if(!metamob || !_id) {
        return {} as Poap;
    }
        
    const res = await metamob.poapFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string, 
    metamob?: Metamob
): Promise<Poap> => {
    if(!metamob || !pubId) {
        return {} as Poap;
    }

    const res = await metamob.poapFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const formatPoapBody = (
    body: string,
    width: number,
    height: number
): string => {
    const r = ('0' + (Math.random()*255|0).toString(16)).substr(-2);
    const g = ('0' + (Math.random()*255|0).toString(16)).substr(-2);
    const b = ('0' + (Math.random()*255|0).toString(16)).substr(-2);
    const rgbBgColor = `#${r}${g}${b}`;

    return (`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <svg version="1.1" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <rect fill="${rgbBgColor}" width="${width}" height="${height}"/>
            ${body}
        </svg>`
    );
};