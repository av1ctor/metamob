import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {UpdateRequest, Update, ModerationRequest} from "../../../declarations/metamob/metamob.did";
import { CampaignResult } from '../libs/campaigns';
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findById, findByPubId } from '../libs/updates';
import { useActors } from './actors';

export const useFindUpdateById = (
    _id: number
): UseQueryResult<Update, Error> => {
    const {metamob} = useActors();
    
    return useQuery<Update, Error>(
        ['updates', _id],  
        () => findById(_id, metamob)
    );
};

export const useFindUpdateByPubId = (
    pubId: string
): UseQueryResult<Update, Error> => {
    const {metamob} = useActors();
    
    return useQuery<Update, Error>(
        ['updates', pubId],  
        () => findByPubId(pubId, metamob)
    );
};


export const useFindUpdates = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Update[], Error> => {
    const {metamob} = useActors();
    
    return useQuery<Update[], Error>(
        ['updates', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit, metamob)
    );

};

export const useFindUpdatesByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<Update[], Error> => {
    const {metamob} = useActors();
    
    return useInfiniteQuery<Update[], Error>(
        ['updates', topicId, ...orderBy], 
        ({pageParam = 0}) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}, metamob),
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: UpdateRequest, result?: CampaignResult}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = options.result === undefined || options.result === CampaignResult.NONE?
                await metamob.updateCreate(options.req):
                await metamob.updateCreateAndFinishCampaign(options.req, options.result);
            
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: UpdateRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.updateUpdate(options.pubId, options.req);
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

export const useModerateUpdate = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: UpdateRequest, mod: ModerationRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.updateModerate(options.pubId, options.req, options.mod);
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
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {pubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.updateDelete(options.pubId);
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