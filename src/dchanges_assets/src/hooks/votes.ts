import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {VoteRequest, DChanges, VoteResponse, Vote} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/votes';

export const useFindVoteById = (
    _id: number, 
    main?: DChanges
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
    limit: Limit
): UseQueryResult<VoteResponse[], Error> => {
    return useQuery<VoteResponse[], Error>(
        ['votes', topicId, ...orderBy, limit.offset, limit.size], 
        () => findByCampaign(topicId, orderBy, limit)
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
    userId: number, 
    orderBy: Order[], 
    limit: Limit,
    main?: DChanges
): UseQueryResult<VoteResponse[], Error> => {
   return useQuery<VoteResponse[], Error>(
        ['votes', userId, ...orderBy, limit.offset, limit.size], 
        () => userId === 0? []: findByUser(userId, orderBy, limit, main)
    );

};

export const useCreateVote = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: VoteRequest}) => {
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
            onSuccess: () => {
                queryClient.invalidateQueries(['votes']);
            }   
        }
    );
};

export const useUpdateVote = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: VoteRequest}) => {
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
        async (options: {main?: DChanges, pubId: string}) => {
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
            onSuccess: () => {
                queryClient.invalidateQueries(['votes']);
            }   
        }
    );
};