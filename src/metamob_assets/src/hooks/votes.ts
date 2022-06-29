import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {VoteRequest, Metamob, VoteResponse, Vote} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/votes';

export const useFindVoteById = (
    _id: number, 
    main?: Metamob
): UseQueryResult<Vote, Error> => {
    return useQuery<Vote, Error>(
        ['votes', _id], 
        () => findById(_id, main)
    );
};

export const useFindVoteByPubId = (
    pubId: string
): UseQueryResult<VoteResponse, Error> => {
    return useQuery<VoteResponse, Error>(
        ['votes', pubId], 
        () => findByPubId(pubId)
    );
};

export const useFindVotes = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<VoteResponse[], Error> => {
    return useQuery<VoteResponse[], Error>(
        ['votes', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindVotesByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<VoteResponse[], Error> => {
    return useInfiniteQuery<VoteResponse[], Error>(
        ['votes', topicId, ...orderBy], 
        ({pageParam = 0}) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}),
        {
            getNextPageParam: (lastPage, pages) =>
                lastPage.length < size? 
                    undefined: 
                    pages.length * size,
        }
    );
};

export const useFindVoteByCampaignAndUser = (
    topicId?: number, 
    userId?: number
): UseQueryResult<VoteResponse, Error> => {
    return useQuery<VoteResponse, Error>(
        ['votes', topicId, userId], 
        () => findByCampaignAndUser(topicId, userId)
    );

};

export const useFindUserVotes = (
    orderBy: Order[], 
    limit: Limit,
    main?: Metamob
): UseQueryResult<VoteResponse[], Error> => {
   return useQuery<VoteResponse[], Error>(
        ['votes', ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );

};

export const useCreateVote = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, req: VoteRequest, campaignPubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.voteCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['votes']);
                queryClient.invalidateQueries(['campaigns', variables.campaignPubId]);
            }   
        }
    );
};

export const useUpdateVote = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: VoteRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.voteUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['votes']);
            }   
        }
    );
};

export const useDeleteVote = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, campaignPubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.voteDelete(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return {};
        },
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['votes']);
                queryClient.invalidateQueries(['campaigns', variables.campaignPubId]);
            }   
        }
    );
};