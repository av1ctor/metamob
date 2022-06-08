import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Category, CategoryRequest, Metamob} from "../../../declarations/metamob/metamob.did";
import { findAll, findById } from '../libs/categories';
import {Filter, Limit, Order} from "../libs/common";

export const useFindCategoryById = (
    queryKey: any[], 
    _id: number
): UseQueryResult<Category, Error> => {
    return useQuery<Category, Error>(
        queryKey, 
        () => findById(_id)
    );
};

export const useFindCategories = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Category [], Error> => {
    return useQuery<Category[], Error>(
        ['categories', ...filters, ...orderBy, limit.offset, limit.size],
        () => findAll(filters, orderBy, limit),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useCreateCategory = (
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, req: CategoryRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.categoryCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['categories']);
            }   
        }
    );
};

export const useUpdateCategory = (
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: CategoryRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.categoryUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['categories']);
            }   
        }
    );
};

export const useDeleteCategory = (
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, req: Category}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.categoryDelete(options.req.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return {};
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['categories']);
            }   
        }
    );
};