import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Challenge, ChallengeRequest, Metamob, ChallengeVoteRequest, Moderation} from "../../../declarations/metamob/metamob.did";
import {Limit, Order} from "../libs/common";
import { findByJudge, findByPubId, findByUser, getModeration } from '../libs/challenges';

export const useFindChallengeByPubId = (
    pubId: string, 
    main?: Metamob
): UseQueryResult<Challenge, Error> => {
    return useQuery<Challenge, Error>(
        ['challenges', pubId], 
        () => findByPubId(pubId, main)
    );
};

export const useFindJudgeChallenges = (
    orderBy: Order[], 
    limit: Limit, 
    userId?: number,
    main?: Metamob
): UseQueryResult<Challenge[], Error> => {
    return useQuery<Challenge[], Error>(
        ['challenges-as-judge', userId, ...orderBy, limit.offset, limit.size], 
        () => findByJudge(orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindUserChallenges = (
    orderBy: Order[], 
    limit: Limit, 
    userId?: number,
    main?: Metamob
): UseQueryResult<Challenge[], Error> => {
    return useQuery<Challenge[], Error>(
        ['challenges', userId, ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useGetChallengedModeration = (
    _id: number, 
    main?: Metamob
): UseQueryResult<Moderation, Error> => {
    return useQuery<Moderation, Error>(
        ['challenges-moderations', _id], 
        () => getModeration(_id, main)
    );
};

export const useCreateChallenge = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, req: ChallengeRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.challengeCreate(options.req);
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
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: ChallengeRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.challengeUpdate(options.pubId, options.req);
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
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: ChallengeVoteRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.challengeVote(options.pubId, options.req);
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
