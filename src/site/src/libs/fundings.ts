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
    limit?: Limit,
    metamob?: Metamob
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

    const res = await metamob?.fundingFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if(!res || 'err' in res) {
        throw new Error(res?.err);
    }

    return res.ok; 
}

export const findByCampaign = async (
    fundingId?: number, 
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<FundingResponse[]> => {
    if(!metamob || !fundingId) {
        return [];
    }
    
    const res = await metamob.fundingFindByCampaign(
        fundingId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaignAndUser = async (
    fundingId?: number, 
    userId?: number,
    metamob?: Metamob
): Promise<FundingResponse> => {
    if(!metamob || !fundingId || !userId) {
        return {} as FundingResponse;
    }
    
    const res = await metamob.fundingFindByCampaignAndUser(
        fundingId, 
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
    metamob?: Metamob
): Promise<FundingResponse[]> => {
    if(!metamob) {
        return [];
    }   

    const res = await metamob.fundingFindByUser(
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
): Promise<Funding> => {
    if(!metamob || !_id) {
        return {} as Funding;
    }
        
    const res = await metamob.fundingFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string,
    metamob?: Metamob
): Promise<FundingResponse> => {
    if(!metamob || !pubId) {
        return {} as FundingResponse;
    }

    const res = await metamob.fundingFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};