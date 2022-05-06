import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {DChanges, Tag, TagRequest, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";

const findAll = async (filters?: Filter, orderBy?: Order, limit?: Limit) => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.tagFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: [[0n, 20n]]);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};

const findById = async (_id: number): Promise<Tag> => {
    const res = await dchanges.tagFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const useFindTagById = (
    queryKey: any[], _id: number
): UseQueryResult<Tag, Error> => {
    return useQuery<Tag, Error>(
        queryKey, 
        () => findById(_id)
    );
};

export const useFindCategories = (
    queryKey: any[], filters?: Filter, orderBy?: Order, limit?: Limit
): UseQueryResult<Tag [], Error> => {
    return useQuery<Tag[], Error>(
        queryKey,
        () => findAll(filters, orderBy, limit)
    );

};

export const useCreateTag = (
    queryKey: any[]
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: TagRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.tagCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                // invalidate, because a new item was created (depending on the current sorting value, its position could be anywhere)
                queryClient.invalidateQueries(queryKey);
            }   
        }
    );
};

export const useUpdateTag = (
    queryKey: any[]
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: Tag}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
        
            const res = await options.main.tagUpdate(options.req.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                // invalidate, because an item was updated (depending on the current sorting value, its position could change)
                queryClient.invalidateQueries(queryKey);
            }   
        }
    );
};

export const useDeleteTag = (
    queryKey: any[]
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: Tag}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
        
            const res = await options.main.tagDelete(options.req.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return {};
        },
        {
            onSuccess: () => {
                // invalidate, because an item was deleted
                queryClient.invalidateQueries(queryKey);
            }   
        }
    );
};