import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Place, PlaceRequest, DChanges} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findById, findByPubId, findByUser, findTreeById } from '../libs/places';

export const useFindPlaceById = (
    _id: number
): UseQueryResult<Place, Error> => {
    return useQuery<Place, Error>(
        ['places', _id], 
        () => findById(_id)
    );
};

export const useFindPlaceTreeById = (
    _id: number
): UseQueryResult<Place[], Error> => {
    return useQuery<Place[], Error>(
        ['places', 'tree', _id], 
        () => findTreeById(_id)
    );
};

export const useFindPlaceByPubId = (
    pubId?: string
): UseQueryResult<Place, Error> => {
    return useQuery<Place, Error>(
        ['places', pubId], 
        () => findByPubId(pubId)
    );
};

export const useFindUserPlaces = (
    userId: number, 
    orderBy: Order, 
    limit: Limit,
    main?: DChanges
): UseQueryResult<Place[], Error> => {
   return useQuery<Place[], Error>(
        ['places', userId, orderBy.key, orderBy.dir, limit.offset, limit.size], 
        () => userId === 0? []: findByUser(userId, orderBy, limit, main)
    );
};

export const useFindPlaces = (
    filters: Filter[], 
    orderBy: Order, 
    limit: Limit
): UseQueryResult<Place [], Error> => {
    return useQuery<Place[], Error>(
        ['places', ...filters, orderBy.key, orderBy.dir, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit)
    );
};

export const useCreatePlace = (
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
                queryClient.invalidateQueries(['places']);
            }   
        }
    );
};

export const useUpdatePlace = (
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
                queryClient.invalidateQueries(['places']);
            }   
        }
    );
};
