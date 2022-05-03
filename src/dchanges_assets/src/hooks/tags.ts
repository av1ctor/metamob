import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {Tag, TagRequest, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../interfaces/common";

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

export const useCreateTag = (queryKey: any[]) => {
    const queryClient = useQueryClient();
    return useMutation(async (tag: TagRequest) => {
            const res = await dchanges.tagCreate(tag);
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

export const useUpdateTag = (queryKey: any[]) => {
    const queryClient = useQueryClient();
    return useMutation(async (tag: Tag) => {
            const res = await dchanges.tagUpdate(tag.pubId, tag);
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

export const useDeleteTag = (queryKey: any[]) => {
    const queryClient = useQueryClient();
    return useMutation(async (tag: Tag) => {
            const res = await dchanges.tagDelete(tag.pubId);
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