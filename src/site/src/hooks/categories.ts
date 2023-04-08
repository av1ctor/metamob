import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Category, CategoryRequest} from "../../../declarations/metamob/metamob.did";
import { findAll, findById } from '../libs/categories';
import {Filter, Limit, Order} from "../libs/common";
import { useActors } from './actors';

export const useFindCategoryById = (
    queryKey: any[], 
    _id?: number
): UseQueryResult<Category, Error> => {
    const {metamob} = useActors();

    return useQuery<Category, Error>(
        queryKey, 
        () => findById(_id, metamob)
    );
};

export const useFindCategories = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Category [], Error> => {
    const {metamob} = useActors();
    
    return useQuery<Category[], Error>(
        ['categories', ...filters, ...orderBy, limit.offset, limit.size],
        () => findAll(filters, orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useCreateCategory = (
) => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: CategoryRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.categoryCreate(options.req);
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
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {pubId: string, req: CategoryRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.categoryUpdate(options.pubId, options.req);
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: Category}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.categoryDelete(options.req.pubId);
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