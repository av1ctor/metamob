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
    signatureId?: number, 
    orderBy?: Order[], 
    limit?: Limit
): Promise<SignatureResponse[]> => {
    if(!signatureId) {
        return [];
    }
    
    const res = await metamob.signatureFindByCampaign(
        signatureId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaignAndUser = async (
    signatureId?: number, 
    userId?: number
): Promise<SignatureResponse> => {
    if(!signatureId || !userId) {
        return {} as SignatureResponse;
    }
    
    const res = await metamob.signatureFindByCampaignAndUser(
        signatureId, 
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
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<SignatureResponse[]> => {
    if(!metamob) {
        return [];
    }   

    const res = await metamob.signatureFindByUser(
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
): Promise<Signature> => {
    if(!metamob || !_id) {
        return {} as Signature;
    }
        
    const res = await metamob.signatureFindById(_id);
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