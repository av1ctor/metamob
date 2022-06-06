import {dchanges} from "../../../declarations/dchanges";
import {Campaign, DChanges, Variant} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum CampaignKind {
    SIGNATURES = 0,
    VOTES = 1,
    WEIGHTED_VOTES = 2,
    FUNDINGS = 3,
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
    {name: 'Votes (weighted)', value: CampaignKind.WEIGHTED_VOTES, icon: 'vote-yea'},
    {name: 'Fundings', value: CampaignKind.FUNDINGS, icon: 'lightbulb'},
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

export const campaignKindToTitle = (
    kind: number
): string => {
    switch(kind) {
        case CampaignKind.SIGNATURES:
            return 'Signatures';
        case CampaignKind.DONATIONS:
            return 'Donations';
        case CampaignKind.FUNDINGS:
            return 'Fundings';
        case CampaignKind.VOTES:
        case CampaignKind.WEIGHTED_VOTES:
            return 'Votes';
        default:
            return 'Unknown';
    }
};

export const campaignKindToIcon = (
    kind: number
): string => {
    switch(kind) {
        case CampaignKind.SIGNATURES:
            return 'signature';
        case CampaignKind.DONATIONS:
            return 'money-bill';
        case CampaignKind.FUNDINGS:
            return 'money-bill';
        case CampaignKind.VOTES:
        case CampaignKind.WEIGHTED_VOTES:
            return 'vote-yea';
        default:
            return '';
    }
};

export const getProVotes = (
    campaign: Campaign
): bigint => {
    if('votes' in campaign.info) {
        return campaign.info.votes.pro;
    }

    return BigInt(0);
};

export const getAgainstVotes = (
    campaign: Campaign
): bigint => {
    if('votes' in campaign.info) {
        return campaign.info.votes.against;
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
