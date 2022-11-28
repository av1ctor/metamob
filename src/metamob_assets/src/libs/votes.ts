import {metamob} from "../../../declarations/metamob";
import {Variant, VoteResponse, Vote, Metamob} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit
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

    const res = await metamob.voteFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaign = async (
    voteId?: number, 
    orderBy?: Order[], 
    limit?: Limit
): Promise<VoteResponse[]> => {
    if(!voteId) {
        return [];
    }
    
    const res = await metamob.voteFindByCampaign(
        voteId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaignAndUser = async (
    voteId?: number, 
    userId?: number
): Promise<VoteResponse> => {
    if(!voteId || !userId) {
        return {} as VoteResponse;
    }
    
    const res = await metamob.voteFindByCampaignAndUser(
        voteId, 
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
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<VoteResponse[]> => {
    if(!metamob) {
        return [];
    }   

    const res = await metamob.voteFindByUser(
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
): Promise<Vote> => {
    if(!metamob || !_id) {
        return {} as Vote;
    }
        
    const res = await metamob.voteFindById(_id);
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

    const res = await metamob.voteFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};