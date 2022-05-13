import {dchanges} from "../../../declarations/dchanges";
import {Variant, SignatureResponse} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter, 
    orderBy?: 
    Order, limit?: Limit
): Promise<SignatureResponse[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
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
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    pubId: string
): Promise<SignatureResponse> => {
    const res = await dchanges.signatureFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};