import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Metamob, PlaceUser, PlaceUserRequest} from "../../../declarations/metamob/metamob.did";
import { findByPlaceAndUser } from '../libs/places-users';

export const useFindByPlaceAndUser = (
    placeId?: number, 
    userId?: number
): UseQueryResult<PlaceUser|undefined, Error> => {
    return useQuery<PlaceUser|undefined, Error>(
        ['places-users', placeId, userId], 
        () => findByPlaceAndUser(placeId, userId)
    );
};

export const useCreatePlaceUser = (
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, req: PlaceUserRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.placeUserCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: (data: PlaceUser) => {
                queryClient.invalidateQueries(['places-users', data.placeId, data.userId]);
            }   
        }
    );
};

export const useUpdatePlaceUser = (
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, req: PlaceUserRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.placeUserUpdate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: (data: PlaceUser) => {
                queryClient.invalidateQueries(['places-users', data.placeId, data.userId]);
            }   
        }
    );
};

export const useDeletePlaceUser = (
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, _id: number}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.placeUserDelete(options._id);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['places-users']);
            }   
        }
    );
};
