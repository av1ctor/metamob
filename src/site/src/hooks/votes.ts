import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {VoteRequest, VoteResponse, Vote, ModerationRequest} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/votes';
import { useActors } from './actors';

export const useFindVoteById = (
    _id: number
): UseQueryResult<Vote, Error> => {
    const {metamob} = useActors();

    return useQuery<Vote, Error>(
        ['votes', _id], 
        () => findById(_id, metamob)
    );
};

export const useFindVoteByPubId = (
    pubId: string
): UseQueryResult<VoteResponse, Error> => {
    const {metamob} = useActors();

    return useQuery<VoteResponse, Error>(
        ['votes', pubId], 
        () => findByPubId(pubId, metamob)
    );
};

export const useFindVotes = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<VoteResponse[], Error> => {
    const {metamob} = useActors();

    return useQuery<VoteResponse[], Error>(
        ['votes', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit, metamob)
    );

};

export const useFindVotesByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<VoteResponse[], Error> => {
    const {metamob} = useActors();

    return useInfiniteQuery<VoteResponse[], Error>(
        ['votes', topicId, ...orderBy], 
        ({pageParam = 0}) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}, metamob),
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
    const {metamob} = useActors();

    return useQuery<VoteResponse, Error>(
        ['votes', topicId, userId], 
        () => findByCampaignAndUser(topicId, userId, metamob)
    );

};

export const useFindUserVotes = (
    orderBy: Order[], 
    limit: Limit,
    userId?: number
): UseQueryResult<VoteResponse[], Error> => {
    const {metamob} = useActors();

    return useQuery<VoteResponse[], Error>(
        ['votes', userId, ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );

};

export const useCreateVote = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: VoteRequest, campaignPubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.voteCreate(options.req);
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: VoteRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.voteUpdate(options.pubId, options.req);
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

export const useModerateVote = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: VoteRequest, mod: ModerationRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.voteModerate(options.pubId, options.req, options.mod);
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, campaignPubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.voteDelete(options.pubId);
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