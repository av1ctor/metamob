import {Metamob, Challenge, Moderation} from "../../../declarations/metamob/metamob.did";
import {Limit, Order} from "./common";

export enum ChallengeState {
    VOTING = 0,
    CLOSED = 1,
}

export enum ChallengeResult {
    NONE = 0,
    ACCEPTED = 1,
    REFUSED = 2,
}

export const results = [
    {name: 'None', value: ChallengeResult.NONE},
    {name: 'Accepted', value: ChallengeResult.ACCEPTED},
    {name: 'Refused', value: ChallengeResult.REFUSED},
];

export const challengeStateToText = (
    state: ChallengeState
): string => {
    switch(state) {
        case ChallengeState.VOTING:
            return 'Voting';
        case ChallengeState.CLOSED:
            return 'Closed';
        default:
            return 'Unknown';
    }
};

export const challengeStateToColor = (
    state: ChallengeState
): string => {
    switch(state) {
        case ChallengeState.VOTING:
            return 'warning';
        case ChallengeState.CLOSED:
            return 'success';
        default:
            return 'black';
    }
};

export const challengeResultToText = (
    result: ChallengeResult
): string => {
    switch(result) {
        case ChallengeResult.NONE:
            return 'None';
        case ChallengeResult.ACCEPTED:
            return 'Accepted';
        case ChallengeResult.REFUSED:
            return 'Refused';
        default:
            return 'Unknown';
    }
};

export const challengeResultToColor = (
    result: ChallengeResult
): string => {
    switch(result) {
        case ChallengeResult.NONE:
            return 'warning';
        case ChallengeResult.ACCEPTED:
            return 'success';
        case ChallengeResult.REFUSED:
            return 'danger';
        default:
            return 'black';
    }
};

export const findById = async (
    _id: number,
    metamob?: Metamob
): Promise<Challenge> => {
    if(!metamob) {
        return {} as Challenge;
    }

    const res = await metamob.challengeFindById(_id);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByPubId = async (
    pubId: string,
    metamob?: Metamob
): Promise<Challenge> => {
    if(!metamob) {
        return {} as Challenge;
    }

    const res = await metamob.challengeFindByPubId(pubId);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByJudge = async (
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<Challenge[]> => {
    if(!metamob) {
        return [];
    }

    const res = await metamob.challengeFindByJudge(
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByUser = async (
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<Challenge[]> => {
    if(!metamob) {
        return [];
    }

    const res = await metamob.challengeFindByUser(
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const getModeration = async (
    _id: number,
    metamob?: Metamob
): Promise<Moderation> => {
    if(!metamob) {
        return {} as Moderation;
    }

    const res = await metamob.challengeGetModeration(_id);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

