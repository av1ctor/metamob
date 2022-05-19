import {dchanges} from "../../../declarations/dchanges";
import {Variant, SignatureResponse, Signature, DChanges} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter[], 
    orderBy?: 
    Order, limit?: Limit
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

    const res = await dchanges.signatureFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaign = async (
    topicId: number, 
    orderBy?: Order, 
    limit?: Limit
): Promise<SignatureResponse[]> => {
    const res = await dchanges.signatureFindByCampaign(
        topicId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
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
    if(topicId === undefined || userId === undefined) {
        return {} as SignatureResponse;
    }
    
    const res = await dchanges.signatureFindByCampaignAndUser(
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
    userId: number, 
    orderBy?: Order, 
    limit?: Limit,
    main?: DChanges
): Promise<SignatureResponse[]> => {
    if(!main) {
        return [];
    }   

    const res = await main.signatureFindByUser(
        userId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    _id: number, 
    main?: DChanges
): Promise<Signature> => {
    if(!main) {
        return {} as Signature;
    }
        
    const res = await main.signatureFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId: string
): Promise<SignatureResponse> => {
    const res = await dchanges.signatureFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};