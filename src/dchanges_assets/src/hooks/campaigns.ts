import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {CampaignRequest, Campaign, DChanges} from "../../../declarations/dchanges/dchanges.did";
import { findAll, findById, findByPubId as findByPubId, findByUser } from '../libs/campaigns';
import {Filter, Limit, Order} from "../libs/common";

export const useFindCampaignById = (
    queryKey: any[], 
    _id: number
): UseQueryResult<Campaign, Error> => {
    return useQuery<Campaign, Error>(
        queryKey, 
        () => findById(_id)
    );
};

export const useFindCampaignByPubId = (
    queryKey: any[], 
    pubId: string
): UseQueryResult<Campaign, Error> => {
    return useQuery<Campaign, Error>(
        queryKey, 
        () => findByPubId(pubId)
    );
};

export const useFindCampaigns = (
    queryKey: any[], 
    filters: Filter[], 
    orderBy: Order, 
    limit: Limit
): UseQueryResult<Campaign[], Error> => {
    return useQuery<Campaign[], Error>(
        queryKey, 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindUserCampaigns = (
    userId: number, 
    orderBy: Order, 
    limit: Limit
): UseQueryResult<Campaign[], Error> => {
    return useQuery<Campaign[], Error>(
        ['user-campaigns', userId, orderBy.key, orderBy.dir], 
        () => userId === -1? []: findByUser(userId, orderBy, limit)
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
                queryClient.invalidateQueries();
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
                queryClient.invalidateQueries();
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
                queryClient.invalidateQueries();
            }   
        }
    );
};