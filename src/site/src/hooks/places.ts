import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {Place, PlaceRequest, ModerationRequest} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findById, findByPubId, findByUser, findTreeById } from '../libs/places';
import { useActors } from './actors';

export const useFindPlaceById = (
    _id: number
): UseQueryResult<Place, Error> => {
    const {metamob} = useActors();

    return useQuery<Place, Error>(
        ['places', _id], 
        () => findById(_id, metamob)
    );
};

export const useFindPlaceTreeById = (
    _id?: number
): UseQueryResult<Place[], Error> => {
    const {metamob} = useActors();

    return useQuery<Place[], Error>(
        ['places', 'tree', _id], 
        () => findTreeById(_id, metamob)
    );
};

export const useFindPlaceByPubId = (
    pubId?: string
): UseQueryResult<Place, Error> => {
    const {metamob} = useActors();

    return useQuery<Place, Error>(
        ['places', pubId], 
        () => findByPubId(pubId, metamob)
    );
};

export const useFindUserPlaces = (
    userId: number, 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Place[], Error> => {
    const {metamob} = useActors();

    return useQuery<Place[], Error>(
        ['places', userId, ...orderBy, limit.offset, limit.size], 
        () => userId === 0? []: findByUser(userId, orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindPlaces = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Place [], Error> => {
    const {metamob} = useActors();

    return useQuery<Place[], Error>(
        ['places', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindPlacesInf = (
    filters: Filter[], 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<Place [], Error> => {
    const {metamob} = useActors();

    return useInfiniteQuery<Place[], Error>(
        ['places', ...filters, ...orderBy], 
        ({ pageParam = 0 }) => findAll(filters, orderBy, {offset: pageParam, size: size}, metamob),
        {
            getNextPageParam: (lastPage, pages) => 
                lastPage.length < size? 
                undefined: 
                pages.length * size,
        }
    );
};

export const useFindChildrenPlacesInf = (
    filters: Filter[], 
    orderBy: Order[], 
    size: number,
    place?: Place
): UseInfiniteQueryResult<Place [], Error> => {
    return useFindPlacesInf([...filters, {key: 'parentId', op: 'eq', value: place? place._id: 0}], orderBy, size);
};

export const useCreatePlace = (
) => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: PlaceRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.placeCreate(options.req);
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: PlaceRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.placeUpdate(options.pubId, options.req);
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

export const useModeratePlace = (
    ) => {
        const queryClient = useQueryClient();
        const {metamob} = useActors();
        
        return useMutation(
            async (options: {pubId: string, req: PlaceRequest, mod: ModerationRequest}) => {
                if(!metamob) {
                    throw Error('Main actor undefined');
                }
    
                const res = await metamob.placeModerate(options.pubId, options.req, options.mod);
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
    