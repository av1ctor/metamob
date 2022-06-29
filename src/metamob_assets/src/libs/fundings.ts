import {metamob} from "../../../declarations/metamob";
import {Variant, FundingResponse, Funding, Metamob} from "../../../declarations/metamob/metamob.did";
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

    const res = await metamob.fundingFind(
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
    
    const res = await metamob.fundingFindByCampaign(
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
    
    const res = await metamob.fundingFindByCampaignAndUser(
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
    orderBy?: Order[], 
    limit?: Limit,
    main?: Metamob
): Promise<FundingResponse[]> => {
    if(!main) {
        return [];
    }   

    const res = await main.fundingFindByUser(
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

    const res = await metamob.fundingFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};