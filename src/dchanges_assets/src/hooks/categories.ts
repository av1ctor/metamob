import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {Category, CategoryRequest, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../interfaces/common";

const findAll = async (filters?: Filter, orderBy?: Order, limit?: Limit) => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.categoryFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: [[0n, 20n]]);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};

const findById = async (_id: number): Promise<Category> => {
    const res = await dchanges.categoryFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const useFindCategoryById = (
    queryKey: any[], _id: number
): UseQueryResult<Category, Error> => {
    return useQuery<Category, Error>(
        queryKey, 
        () => findById(_id)
    );
};
export const useFindCategories = (
    queryKey: any[], filters?: Filter, orderBy?: Order, limit?: Limit
): UseQueryResult<Category [], Error> => {
    return useQuery<Category[], Error>(
        queryKey,
        () => findAll(filters, orderBy, limit)
    );

};

export const useCreateCategory = (queryKey: any[]) => {
    const queryClient = useQueryClient();
    return useMutation(async (category: CategoryRequest) => {
            const res = await dchanges.categoryCreate(category);
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

export const useUpdateCategory = (queryKey: any[]) => {
    const queryClient = useQueryClient();
    return useMutation(async (category: Category) => {
            const res = await dchanges.categoryUpdate(category.pubId, category);
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

export const useDeleteCategory = (queryKey: any[]) => {
    const queryClient = useQueryClient();
    return useMutation(async (category: Category) => {
            const res = await dchanges.categoryDelete(category.pubId);
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