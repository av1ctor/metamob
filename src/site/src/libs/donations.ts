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
    limit?: Limit,
    metamob?: Metamob
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

    const res = await metamob?.donationFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if(!res || 'err' in res) {
        throw new Error(res?.err);
    }

    return res.ok; 
}

export const findByCampaign = async (
    donationId?: number, 
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<DonationResponse[]> => {
    if(!metamob || !donationId) {
        return [];
    }
    
    const res = await metamob.donationFindByCampaign(
        donationId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByCampaignAndUser = async (
    donationId?: number, 
    userId?: number,
    metamob?: Metamob
): Promise<DonationResponse> => {
    if(!metamob || !donationId || !userId) {
        return {} as DonationResponse;
    }
    
    const res = await metamob.donationFindByCampaignAndUser(
        donationId, 
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
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<DonationResponse[]> => {
    if(!metamob) {
        return [];
    }   

    const res = await metamob.donationFindByUser(
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
): Promise<Donation> => {
    if(!metamob || !_id) {
        return {} as Donation;
    }
        
    const res = await metamob.donationFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string,
    metamob?: Metamob
): Promise<DonationResponse> => {
    if(!metamob || !pubId) {
        return {} as DonationResponse;
    }

    const res = await metamob.donationFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};