import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Metamob, PlaceUser, PlaceUserRequest} from "../../../declarations/metamob/metamob.did";
import { findByPlaceAndUser } from '../libs/places-users';
import { useActors } from './actors';

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
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {req: PlaceUserRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.placeUserCreate(options.req);
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: PlaceUserRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.placeUserUpdate(options.req);
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
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {_id: number}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.placeUserDelete(options._id);
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
