import {dchanges} from "../../../declarations/dchanges";
import {Campaign, DChanges, Variant} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum CampaignKind {
    SIGNATURES = 0,
    VOTES = 1,
    ANON_VOTES = 2,
    WEIGHTED_VOTES = 3,
    DONATIONS = 4
};

export enum CampaignState {
    CREATED = 0,
    CANCELED = 1,
    DELETED = 2,
    PUBLISHED = 3,
    FINISHED = 4,
    BANNED = 5,
}

export enum CampaignResult {
    NONE = 0,
    WON = 1,
    LOST = 2,
}

export const kindOptions = [
    {name: 'Signatures', value: CampaignKind.SIGNATURES, icon: 'signature'},
    {name: 'Votes', value: CampaignKind.VOTES, icon: 'vote-yea'},
    {name: 'Votes (anonymous)', value: CampaignKind.ANON_VOTES, icon: 'vote-yea'},
    {name: 'Votes (weighted)', value: CampaignKind.WEIGHTED_VOTES, icon: 'vote-yea'},
    {name: 'Donations', value: CampaignKind.DONATIONS, icon: 'money-bill'},
];

export const campaignStateToText = (
    state: CampaignState
): string => {
    switch(state) {
        case CampaignState.BANNED:
            return 'Banned';
        case CampaignState.CANCELED:
            return 'Canceled';
        case CampaignState.CREATED:
            return 'Created';
        case CampaignState.DELETED:
            return 'Deleted';
        case CampaignState.FINISHED:
            return 'Finished';
        case CampaignState.PUBLISHED:
            return 'Published';
        default:
            return 'Unknown';
    }
};

export const getGoalValue = (
    campaign: Campaign
): bigint => {
    if('signatures' in campaign.info) {
        return BigInt(campaign.info.signatures.goal);
    }
    else if('votes' in campaign.info) {
        return BigInt(campaign.info.votes.goal);
    }
    else if('anonVotes' in campaign.info) {
        return BigInt(campaign.info.anonVotes.goal);
    }
    else if('weightedVotes' in campaign.info) {
        return campaign.info.weightedVotes.goal;
    }
    else if('donations' in campaign.info) {
        return campaign.info.donations.goal;
    }

    return BigInt(0);
};

export const getProVotes = (
    campaign: Campaign
): bigint => {
    if('votes' in campaign.info) {
        return BigInt(campaign.info.votes.pro);
    }
    else if('anonVotes' in campaign.info) {
        return BigInt(campaign.info.anonVotes.pro);
    }
    else if('weightedVotes' in campaign.info) {
        return campaign.info.weightedVotes.pro;
    }

    return BigInt(0);
};

export const getAgainstVotes = (
    campaign: Campaign
): bigint => {
    if('votes' in campaign.info) {
        return BigInt(campaign.info.votes.against);
    }
    else if('anonVotes' in campaign.info) {
        return BigInt(campaign.info.anonVotes.against);
    }
    else if('weightedVotes' in campaign.info) {
        return campaign.info.weightedVotes.against;
    }

    return BigInt(0);
};

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit
): Promise<Campaign[]> => {
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

    const res = await dchanges.campaignFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByUser = async (
    userId?: number, 
    orderBy?: Order[], 
    limit?: Limit,
    main?: DChanges
): Promise<Campaign[]> => {
    if(!main || !userId) {
        return [];
    }

    const res = await main.campaignFindByUser(
        userId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findById = async (
    _id?: number
): Promise<Campaign> => {
    if(!_id) {
        return {} as Campaign;
    }

    const res = await dchanges.campaignFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string
): Promise<Campaign> => {
    if(!pubId) {
        return {} as Campaign;
    }
    
    const res = await dchanges.campaignFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPlaceId = async (
    placeId?: number,
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit
): Promise<Campaign[]> => {
    if(!placeId) {
        return [];
    }

    return findAll(filters?.concat({key: 'placeId', op: 'eq', value: placeId}), orderBy, limit);
}

export const getBalance = async (
    campaignId: number, 
    main?: DChanges
): Promise<bigint> => {
    if(!main) {
        return BigInt(0);
    }

    const res = await main.campaignGetBalance(campaignId);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const withdraw = async (
    campaignId: number, 
    to: string,
    main?: DChanges
): Promise<void> => {
    if(!main) {
        return;
    }

    const res = await main.campaignWithdraw(campaignId, to);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return; 
}
