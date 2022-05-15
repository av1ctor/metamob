import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Region, RegionRequest, DChanges} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findById, findTreeById } from '../libs/regions';

export const useFindRegionById = (
    queryKey: any[], _id: number
): UseQueryResult<Region, Error> => {
    return useQuery<Region, Error>(
        queryKey, 
        () => findById(_id)
    );
};

export const useFindRegionTreeById = (
    queryKey: any[], _id: number
): UseQueryResult<Region[], Error> => {
    return useQuery<Region[], Error>(
        queryKey, 
        () => findTreeById(_id)
    );
};

export const useFindRegions = (
    queryKey: any[], filters?: Filter, orderBy?: Order, limit?: Limit
): UseQueryResult<Region [], Error> => {
    return useQuery<Region[], Error>(
        queryKey,
        () => findAll(filters, orderBy, limit)
    );

};

export const useCreateRegion = (
    queryKey: any[]
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: RegionRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.regionCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(queryKey);
            }   
        }
    );
};

export const useUpdateRegion = (
    queryKey: any[]
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: Region}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.regionUpdate(options.req.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(queryKey);
            }   
        }
    );
};
