import {dchanges} from "../../../declarations/dchanges";
import {Variant, VoteResponse, Vote, DChanges} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter[], 
    orderBy?: 
    Order, limit?: Limit
): Promise<VoteResponse[]> => {
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

    const res = await dchanges.voteFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaign = async (
    topicId?: number, 
    orderBy?: Order, 
    limit?: Limit
): Promise<VoteResponse[]> => {
    if(!topicId) {
        return [];
    }
    
    const res = await dchanges.voteFindByCampaign(
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
): Promise<VoteResponse> => {
    if(!topicId || !userId) {
        return {} as VoteResponse;
    }
    
    const res = await dchanges.voteFindByCampaignAndUser(
        topicId, 
        userId);
    
    if('err' in res) {
        if(res.err === 'Not found') {
            return {} as VoteResponse;
        }
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByUser = async (
    userId?: number, 
    orderBy?: Order, 
    limit?: Limit,
    main?: DChanges
): Promise<VoteResponse[]> => {
    if(!main || !userId) {
        return [];
    }   

    const res = await main.voteFindByUser(
        userId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    _id?: number, 
    main?: DChanges
): Promise<Vote> => {
    if(!main || !_id) {
        return {} as Vote;
    }
        
    const res = await main.voteFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string
): Promise<VoteResponse> => {
    if(!pubId) {
        return {} as VoteResponse;
    }

    const res = await dchanges.voteFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};