import {Campaign, Metamob, Place, Variant} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";
import { e8sToDecimal } from "./icp";

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
    BUILDING = 5,
}

export enum CampaignResult {
    NONE = 0,
    OK = 1,
    NOK = 2,
}

export const kindOptions = [
    {name: 'Signatures', value: CampaignKind.SIGNATURES, icon: 'signature'},
    {name: 'Votes', value: CampaignKind.VOTES, icon: 'vote-yea'},
    {name: 'Votes (weighted)', value: CampaignKind.WEIGHTED_VOTES, icon: 'vote-yea'},
    {name: 'Fundraising', value: CampaignKind.FUNDINGS, icon: 'lightbulb'},
    {name: 'Donations', value: CampaignKind.DONATIONS, icon: 'money-bill'},
];

export const stateOptions = [
    {name: 'Created', value: CampaignState.CREATED},
    {name: 'Published', value: CampaignState.PUBLISHED},
    {name: 'Finished', value: CampaignState.FINISHED},
    {name: 'Canceled', value: CampaignState.CANCELED},
    {name: 'Deleted', value: CampaignState.DELETED},
    {name: 'Building', value: CampaignState.BUILDING},
];

export const campaignStateToText = (
    state: CampaignState
): string => {
    switch(state) {
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
        case CampaignState.BUILDING:
            return 'Building';
        default:
            return 'Unknown';
    }
};

export const campaignStateToColor = (
    state: CampaignState
): string => {
    switch(state) {
        case CampaignState.CANCELED:
            return 'danger';
        case CampaignState.CREATED:
            return 'light';
        case CampaignState.DELETED:
            return 'danger';
        case CampaignState.FINISHED:
            return 'success';
        case CampaignState.PUBLISHED:
            return 'info';
        case CampaignState.BUILDING:
            return 'warning';
        default:
            return '';
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
            return 'Raised';
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
            return 'lightbulb';
        case CampaignKind.VOTES:
        case CampaignKind.WEIGHTED_VOTES:
            return 'vote-yea';
        default:
            return '';
    }
};

export const campaignKindToGoal = (
    kind: number
): string => {
    let suffix = '';
    switch(kind) {
        case CampaignKind.DONATIONS: 
        case CampaignKind.FUNDINGS: 
            suffix = '(ICP)';
            break;
        case CampaignKind.SIGNATURES: 
            suffix = '(Signatures)'; 
            break;
        case CampaignKind.VOTES:
        case CampaignKind.WEIGHTED_VOTES:
            suffix = '(Votes)';
            break;
    }

    return `Goal ${suffix}`;
};

interface VoteResp {
    num: bigint, 
    str: string
}

export const getVotes = (
    campaign: Campaign,
    place?: Place
): {pro: VoteResp; against: VoteResp, total: VoteResp, goal: VoteResp} => {
    const _toString = (value: bigint) => 
        campaign.kind === CampaignKind.WEIGHTED_VOTES && place?.auth && 'dip20' in place?.auth?
            e8sToDecimal(value):
            value.toString();

    if('votes' in campaign.info) {
        const pro = campaign.info.votes.pro;
        const against = campaign.info.votes.against;
        
        return {
            pro: {num: pro, str: _toString(pro)},
            against: {num: against, str: _toString(against)},
            total: {num: pro + against, str: _toString(pro + against)},
            goal: {num: campaign.goal, str: _toString(campaign.goal)}
        };
    }

    return {
        pro: {num: 0n, str: '0'},
        against: {num: 0n, str: '0'},
        total: {num: 0n, str: '0'},
        goal: {num: 0n, str: '0'}
    };
};

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
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

    const res = await metamob?.campaignFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if(!res || 'err' in res) {
        throw new Error(res?.err);
    }

    return res.ok; 
}

export const findByUser = async (
    userId?: number, 
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<Campaign[]> => {
    if(!metamob || !userId) {
        return [];
    }

    const res = await metamob.campaignFindByUser(
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
    metamob?: Metamob
): Promise<Campaign> => {
    if(!metamob || !_id) {
        return {} as Campaign;
    }

    const res = await metamob.campaignFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string,
    metamob?: Metamob
): Promise<Campaign> => {
    if(!metamob || !pubId) {
        return {} as Campaign;
    }
    
    const res = await metamob.campaignFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPlaceId = async (
    placeId?: number,
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<Campaign[]> => {
    if(!placeId) {
        return [];
    }

    return findAll(filters?.concat({key: 'placeId', op: 'eq', value: placeId}), orderBy, limit, metamob);
}
