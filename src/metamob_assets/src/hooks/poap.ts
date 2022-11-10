import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {PoapRequest, Metamob, Poap, ModerationRequest} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findById, findByPubId, findByUser } from '../libs/poap';

export const useFindPoapById = (
    _id: number, 
    main?: Metamob
): UseQueryResult<Poap, Error> => {
    return useQuery<Poap, Error>(
        ['poaps', _id], 
        () => findById(_id, main)
    );
};

export const useFindPoapByPubId = (
    pubId: string
): UseQueryResult<Poap, Error> => {
    return useQuery<Poap, Error>(
        ['poaps', pubId], 
        () => findByPubId(pubId)
    );
};

export const useFindPoaps = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Poap[], Error> => {
    return useQuery<Poap[], Error>(
        ['poaps', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindPoapsByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<Poap[], Error> => {
    return useInfiniteQuery<Poap[], Error>(
        ['poaps', topicId, ...orderBy], 
        ({ pageParam = 0 }) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}),
        {
            getNextPageParam: (lastPage, pages) => 
                lastPage.length < size? 
                undefined: 
                pages.length * size,
        }
    );
};

export const useFindUserPoaps = (
    orderBy: Order[], 
    limit: Limit,
    userId?: number,
    main?: Metamob
): UseQueryResult<Poap[], Error> => {
   return useQuery<Poap[], Error>(
        ['poaps', userId, ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );

};

export const useCreatePoap = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, req: PoapRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.poapCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['poaps']);
            }   
        }
    );
};

export const useUpdatePoap = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: PoapRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.poapUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['poaps']);
            }   
        }
    );
};

export const useModeratePoap = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: PoapRequest, mod: ModerationRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.poapModerate(options.pubId, options.req, options.mod);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['poaps']);
            }   
        }
    );
};

export const useMintPoap = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.poapMint(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['poaps']);
            }   
        }
    );
};

export const useDeletePoap = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, campaignPubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.poapDelete(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return {};
        },
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['poaps']);
                queryClient.invalidateQueries(['campaigns', variables.campaignPubId]);
            }   
        }
    );
};