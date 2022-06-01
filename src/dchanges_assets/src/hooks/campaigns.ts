import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {CampaignRequest, Campaign, DChanges} from "../../../declarations/dchanges/dchanges.did";
import { findAll, findById, findByPlaceId, findByPubId, findByUser } from '../libs/campaigns';
import {Filter, Limit, Order} from "../libs/common";

export const useFindCampaignById = (
    _id: number
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
    limit: Limit,
    placeId?: number
): UseQueryResult<Campaign[], Error> => {
    return useQuery<Campaign[], Error>(
        ['campaigns', placeId, ...filters, ...orderBy, limit.offset, limit.size], 
        () => findByPlaceId(placeId, filters, orderBy, limit)
    );
};

export const useFindCampaigns = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Campaign[], Error> => {
    return useQuery<Campaign[], Error>(
        ['campaigns', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindCampaignsByUserId = (
    userId: number, 
    orderBy: Order[], 
    limit: Limit,
    main?: DChanges
): UseQueryResult<Campaign[], Error> => {
    return useQuery<Campaign[], Error>(
        ['campaigns', userId, ...orderBy, limit.offset, limit.size], 
        () => userId === 0? []: findByUser(userId, orderBy, limit, main)
    );
};

export const useCreateCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: CampaignRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }            
            
            const res = await options.main.campaignCreate(options.req);
            
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
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: CampaignRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.campaignUpdate(options.pubId, options.req);
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

export const usePublishCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.campaignPublish(options.pubId);
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
    return useMutation(
        async (options: {main?: DChanges, pubId: string, value: bigint}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.campaignBoost(options.pubId, options.value);
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
    return useMutation(
        async (options: {main?: DChanges, pubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.campaignDelete(options.pubId);
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