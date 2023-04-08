import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Challenge, ChallengeRequest, ChallengeVoteRequest, Moderation} from "../../../declarations/metamob/metamob.did";
import {Limit, Order} from "../libs/common";
import { findByJudge, findByPubId, findByUser, getModeration } from '../libs/challenges';
import { useActors } from './actors';

export const useFindChallengeByPubId = (
    pubId: string
): UseQueryResult<Challenge, Error> => {
    const {metamob} = useActors();
    
    return useQuery<Challenge, Error>(
        ['challenges', pubId], 
        () => findByPubId(pubId, metamob)
    );
};

export const useFindJudgeChallenges = (
    orderBy: Order[], 
    limit: Limit, 
    userId?: number
): UseQueryResult<Challenge[], Error> => {
    const {metamob} = useActors();

    return useQuery<Challenge[], Error>(
        ['challenges-as-judge', userId, ...orderBy, limit.offset, limit.size], 
        () => findByJudge(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindUserChallenges = (
    orderBy: Order[], 
    limit: Limit, 
    userId?: number
): UseQueryResult<Challenge[], Error> => {
    const {metamob} = useActors();

    return useQuery<Challenge[], Error>(
        ['challenges', userId, ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useGetChallengedModeration = (
    _id: number
): UseQueryResult<Moderation, Error> => {
    const {metamob} = useActors();
    
    return useQuery<Moderation, Error>(
        ['challenges-moderations', _id], 
        () => getModeration(_id, metamob)
    );
};

export const useCreateChallenge = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: ChallengeRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.challengeCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['challenges']);
                queryClient.invalidateQueries(['moderations']);
            }   
        }
    );
};

export const useUpdateChallenge = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: ChallengeRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.challengeUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['challenges']);
            }   
        }
    );
};

export const useVoteChallenge = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {pubId: string, req: ChallengeVoteRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.challengeVote(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['challenges']);
                queryClient.invalidateQueries(['challenges-as-judge']);
            }   
        }
    );
};
