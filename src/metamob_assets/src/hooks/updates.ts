import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {UpdateRequest, Update, Metamob} from "../../../declarations/metamob/metamob.did";
import { CampaignResult } from '../libs/campaigns';
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findById, findByPubId } from '../libs/updates';

export const useFindUpdateById = (
    _id: number, 
    main?: Metamob
): UseQueryResult<Update, Error> => {
    return useQuery<Update, Error>(
        ['updates', _id],  
        () => findById(_id, main)
    );
};

export const useFindUpdateByPubId = (
    pubId: string
): UseQueryResult<Update, Error> => {
    return useQuery<Update, Error>(
        ['updates', pubId],  
        () => findByPubId(pubId)
    );
};


export const useFindUpdates = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Update[], Error> => {
    return useQuery<Update[], Error>(
        ['updates', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindUpdatesByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<Update[], Error> => {
    return useInfiniteQuery<Update[], Error>(
        ['updates', topicId, ...orderBy], 
        ({pageParam = 0}) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}),
        {
            getNextPageParam: (lastPage, pages) => 
                lastPage.length < size? 
                    undefined: 
                    pages.length * size,
        }
    );

};

export const useCreateUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, req: UpdateRequest, result?: CampaignResult}) => {
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
                queryClient.invalidateQueries(['updates']);
            }   
        }
    );
};

export const useUpdateUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: UpdateRequest}) => {
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
                queryClient.invalidateQueries(['updates']);
            }   
        }
    );
};

export const useDeleteUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string}) => {
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
                queryClient.invalidateQueries(['updates']);
            }   
        }
    );
};