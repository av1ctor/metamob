import {useQuery, UseQueryResult, useMutation, useQueryClient, useInfiniteQuery, UseInfiniteQueryResult} from 'react-query'
import {CampaignRequest, Campaign, Metamob, ModerationRequest, FileRequest} from "../../../declarations/metamob/metamob.did";
import { findAll, findById, findByPlaceId, findByPubId, findByUser } from '../libs/campaigns';
import {Filter, Limit, Order} from "../libs/common";
import { useActors } from './actors';

export const useFindCampaignById = (
    _id?: number
): UseQueryResult<Campaign, Error> => {
    return useQuery<Campaign, Error>(
        ['campaigns', _id], 
        () => findById(_id)
    );
};

export const useFindCampaignByPubId = (
    pubId?: string
): UseQueryResult<Campaign, Error> => {
    return useQuery<Campaign, Error>(
        ['campaigns', pubId], 
        () => findByPubId(pubId)
    );
};

export const useFindCampaignsByPlaceId = (
    filters: Filter[], 
    orderBy: Order[], 
    size: number,
    placeId?: number
): UseInfiniteQueryResult<Campaign[], Error> => {
    return useInfiniteQuery<Campaign[], Error>(
        ['campaigns', placeId, ...filters, ...orderBy], 
        ({ pageParam = 0 }) => findByPlaceId(placeId, filters, orderBy, {offset: pageParam, size: size}),
        {
            getNextPageParam: (lastPage, pages) => 
                lastPage.length < size? 
                undefined: 
                pages.length * size,
        }
    );
};

export const useFindCampaigns = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Campaign[], Error> => {
    return useQuery<Campaign[], Error>(
        ['campaigns', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindCampaignsInf = (
    filters: Filter[], 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<Campaign[], Error> => {
    return useInfiniteQuery<Campaign[], Error>(
        ['campaigns', ...filters, ...orderBy],
        ({ pageParam = 0 }) => findAll(filters, orderBy, {offset: pageParam, size: size}),
        {
            getNextPageParam: (lastPage, pages) => 
                lastPage.length < size? 
                undefined: 
                pages.length * size,
        }
    );
};

export const useFindCampaignsByUserId = (
    userId: number, 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Campaign[], Error> => {
    const {metamob} = useActors();

    return useQuery<Campaign[], Error>(
        ['campaigns', userId, ...orderBy, limit.offset, limit.size], 
        () => userId === 0? []: findByUser(userId, orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useCreateCampaign = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: CampaignRequest, cover?: FileRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }            
            
            const res = options.cover?
                await metamob.campaignCreateWithFile(options.req, options.cover):
                await metamob.campaignCreate(options.req);
            
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['campaigns']);
            }   
        }
    );
};

export const useUpdateCampaign = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: CampaignRequest, cover?: FileRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = options.cover?
                await metamob.campaignUpdateWithFile(options.pubId, options.req, options.cover):
                await metamob.campaignUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['campaigns']);
            }   
        }
    );
};

export const useModerateCampaign = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: CampaignRequest, mod: ModerationRequest, cover?: FileRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = options.cover?
                await metamob.campaignModerateWithFile(options.pubId, options.req, options.cover, options.mod):
                await metamob.campaignModerate(options.pubId, options.req, options.mod);
                
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['campaigns']);
            }   
        }
    );
};

export const useBoostCampaign = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, value: bigint}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.campaignBoost(options.pubId, options.value);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['campaigns']);
            }   
        }
    );
};

export const useDeleteCampaign = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {pubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.campaignDelete(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return {};
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['campaigns']);
            }   
        }
    );
};