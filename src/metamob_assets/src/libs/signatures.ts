import {metamob} from "../../../declarations/metamob";
import {Variant, SignatureResponse, Signature, Metamob} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit
): Promise<SignatureResponse[]> => {
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

    const res = await metamob.signatureFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaign = async (
    topicId?: number, 
    orderBy?: Order[], 
    limit?: Limit
): Promise<SignatureResponse[]> => {
    if(!topicId) {
        return [];
    }
    
    const res = await metamob.signatureFindByCampaign(
        topicId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaignAndUser = async (
    topicId?: number, 
    userId?: number
): Promise<SignatureResponse> => {
    if(!topicId || !userId) {
        return {} as SignatureResponse;
    }
    
    const res = await metamob.signatureFindByCampaignAndUser(
        topicId, 
        userId);
    
    if('err' in res) {
        if(res.err === 'Not found') {
            return {} as SignatureResponse;
        }
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByUser = async (
    userId?: number, 
    orderBy?: Order[], 
    limit?: Limit,
    main?: Metamob
): Promise<SignatureResponse[]> => {
    if(!main || !userId) {
        return [];
    }   

    const res = await main.signatureFindByUser(
        userId, 
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
): Promise<Signature> => {
    if(!main || !_id) {
        return {} as Signature;
    }
        
    const res = await main.signatureFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string
): Promise<SignatureResponse> => {
    if(!pubId) {
        return {} as SignatureResponse;
    }

    const res = await metamob.signatureFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};