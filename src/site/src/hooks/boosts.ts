import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {BoostRequest, BoostResponse, Boost} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/boosts';
import { useActors } from './actors';

export const useFindBoostById = (
    _id: number
): UseQueryResult<Boost, Error> => {
    const {metamob} = useActors();

    return useQuery<Boost, Error>(
        ['boosts', _id], 
        () => findById(_id, metamob)
    );
};

export const useFindBoostByPubId = (
    pubId: string
): UseQueryResult<BoostResponse, Error> => {
    const {metamob} = useActors();

    return useQuery<BoostResponse, Error>(
        ['boosts', pubId], 
        () => findByPubId(pubId, metamob)
    );
};

export const useFindBoosts = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<BoostResponse[], Error> => {
    const {metamob} = useActors();
    
    return useQuery<BoostResponse[], Error>(
        ['boosts', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit, metamob)
    );

};

export const useFindBoostsByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<BoostResponse[], Error> => {
    const {metamob} = useActors();

    return useInfiniteQuery<BoostResponse[], Error>(
        ['boosts', topicId, ...orderBy], 
        ({ pageParam = 0 }) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}, metamob),
        {
            getNextPageParam: (lastPage, pages) => 
                lastPage.length < size? 
                undefined: 
                pages.length * size,
        }
    );
};

export const useFindBoostByCampaignAndUser = (
    topicId?: number, 
    userId?: number
): UseQueryResult<BoostResponse, Error> => {
    const {metamob} = useActors();

    return useQuery<BoostResponse, Error>(
        ['boosts', topicId, userId], 
        () => findByCampaignAndUser(topicId, userId, metamob)
    );

};

export const useFindUserBoosts = (
    orderBy: Order[], 
    limit: Limit,
    userId?: number
): UseQueryResult<BoostResponse[], Error> => {
    const {metamob} = useActors();

   return useQuery<BoostResponse[], Error>(
        ['boosts', userId, ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );

};

export const useCreateBoost = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {req: BoostRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.boostCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['boosts']);
            }   
        }
    );
};

export const useCompleteBoost = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, campaignPubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.boostComplete(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['boosts']);
                queryClient.invalidateQueries(['campaigns', variables.campaignPubId]);
            }   
        }
    );
};

export const useUpdateBoost = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: BoostRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.boostUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['boosts']);
            }   
        }
    );
};
