import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Place, PlaceRequest, DChanges} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findById, findTreeById } from '../libs/places';

export const useFindPlaceById = (
    queryKey: any[], 
    _id: number
): UseQueryResult<Place, Error> => {
    return useQuery<Place, Error>(
        queryKey, 
        () => findById(_id)
    );
};

export const useFindPlaceTreeById = (
    queryKey: any[], 
    _id: number
): UseQueryResult<Place[], Error> => {
    return useQuery<Place[], Error>(
        queryKey, 
        () => findTreeById(_id)
    );
};

export const useFindPlaces = (
    queryKey: any[], 
    filters?: Filter[], 
    orderBy?: Order, 
    limit?: Limit
): UseQueryResult<Place [], Error> => {
    return useQuery<Place[], Error>(
        queryKey,
        () => findAll(filters, orderBy, limit)
    );

};

export const useCreatePlace = (
    queryKey: any[]
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: PlaceRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.placeCreate(options.req);
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

export const useUpdatePlace = (
    queryKey: any[]
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: PlaceRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.placeUpdate(options.pubId, options.req);
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
