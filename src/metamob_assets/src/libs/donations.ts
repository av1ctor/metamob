import {metamob} from "../../../declarations/metamob";
import {Variant, DonationResponse, Donation, Metamob} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum DonationState {
    CREATED,
    COMPLETED,
};

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit
): Promise<DonationResponse[]> => {
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

    const res = await metamob.donationFind(
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
): Promise<DonationResponse[]> => {
    if(!topicId) {
        return [];
    }
    
    const res = await metamob.donationFindByCampaign(
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
): Promise<DonationResponse> => {
    if(!topicId || !userId) {
        return {} as DonationResponse;
    }
    
    const res = await metamob.donationFindByCampaignAndUser(
        topicId, 
        userId);
    
    if('err' in res) {
        if(res.err === 'Not found') {
            return {} as DonationResponse;
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
): Promise<DonationResponse[]> => {
    if(!main || !userId) {
        return [];
    }   

    const res = await main.donationFindByUser(
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
): Promise<Donation> => {
    if(!main || !_id) {
        return {} as Donation;
    }
        
    const res = await main.donationFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string
): Promise<DonationResponse> => {
    if(!pubId) {
        return {} as DonationResponse;
    }

    const res = await metamob.donationFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};