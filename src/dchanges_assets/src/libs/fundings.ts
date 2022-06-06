import {dchanges} from "../../../declarations/dchanges";
import {Variant, FundingResponse, Funding, DChanges} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum FundingState {
    CREATED,
    COMPLETED,
};

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit
): Promise<FundingResponse[]> => {
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

    const res = await dchanges.fundingFind(
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
): Promise<FundingResponse[]> => {
    if(!topicId) {
        return [];
    }
    
    const res = await dchanges.fundingFindByCampaign(
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
): Promise<FundingResponse> => {
    if(!topicId || !userId) {
        return {} as FundingResponse;
    }
    
    const res = await dchanges.fundingFindByCampaignAndUser(
        topicId, 
        userId);
    
    if('err' in res) {
        if(res.err === 'Not found') {
            return {} as FundingResponse;
        }
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByUser = async (
    userId?: number, 
    orderBy?: Order[], 
    limit?: Limit,
    main?: DChanges
): Promise<FundingResponse[]> => {
    if(!main || !userId) {
        return [];
    }   

    const res = await main.fundingFindByUser(
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
    main?: DChanges
): Promise<Funding> => {
    if(!main || !_id) {
        return {} as Funding;
    }
        
    const res = await main.fundingFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string
): Promise<FundingResponse> => {
    if(!pubId) {
        return {} as FundingResponse;
    }

    const res = await dchanges.fundingFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};