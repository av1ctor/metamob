import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {UpdateRequest, Update, Variant, DChanges} from "../../../declarations/dchanges/dchanges.did";
import { CampaignResult } from '../libs/campaigns';
import {Filter, Limit, Order} from "../libs/common";

const findAll = async (filters?: Filter, orderBy?: Order, limit?: Limit): Promise<Update[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.updateFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findByCampaign = async (topicId: number, orderBy?: Order, limit?: Limit): Promise<Update[]> => {
    const res = await dchanges.updateFindByCampaign(
        topicId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findById = async (pubId: string): Promise<Update> => {
    const res = await dchanges.updateFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const useFindUpdateById = (
    queryKey: any[], pubId: string
): UseQueryResult<Update, Error> => {
    return useQuery<Update, Error>(
        queryKey, 
        () => findById(pubId)
    );
};

export const useFindUpdates = (
    queryKey: any[], filters: Filter, orderBy: Order, limit: Limit
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
                
            const res = options.result === undefined?
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