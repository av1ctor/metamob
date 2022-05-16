import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {UpdateRequest, Update, DChanges} from "../../../declarations/dchanges/dchanges.did";
import { CampaignResult } from '../libs/campaigns';
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findById } from '../libs/updates';

export const useFindUpdateById = (
    queryKey: any[], pubId: string
): UseQueryResult<Update, Error> => {
    return useQuery<Update, Error>(
        queryKey, 
        () => findById(pubId)
    );
};

export const useFindUpdates = (
    queryKey: any[], filters: Filter[], orderBy: Order, limit: Limit
): UseQueryResult<Update[], Error> => {
    return useQuery<Update[], Error>(
        queryKey, 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindUpdatesByCampaign = (
    queryKey: any[], topicId: number, orderBy: Order, limit: Limit
): UseQueryResult<Update[], Error> => {
    return useQuery<Update[], Error>(
        queryKey, 
        () => findByCampaign(topicId, orderBy, limit)
    );

};

export const useCreateUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: UpdateRequest, result?: CampaignResult}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = options.result === undefined || options.result === CampaignResult.NONE?
                await options.main.updateCreate(options.req):
                await options.main.updateCreateAndFinishCampaign(options.req, options.result);
            
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

export const useUpdateUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: UpdateRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.updateUpdate(options.pubId, options.req);
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

export const useDeleteUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.updateDelete(options.pubId);
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