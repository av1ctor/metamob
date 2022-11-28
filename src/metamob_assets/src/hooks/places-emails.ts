import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Metamob, PlaceEmail, PlaceEmailRequest} from "../../../declarations/metamob/metamob.did";
import {Limit, Order} from "../libs/common";
import { findAll } from '../libs/places-emails';
import { useActors } from './actors';

export const useFindPlacesEmails = (
    placeId: number, 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<PlaceEmail[], Error> => {
    const {metamob} = useActors();
    
    return useQuery<PlaceEmail[], Error>(
        ['places-emails', placeId, ...orderBy, limit.offset, limit.size], 
        () => findAll(placeId, orderBy, limit, metamob)
    );
};

export const useCreatePlaceEmail = (
) => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {req: PlaceEmailRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.placeEmailCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['places-emails']);
            }   
        }
    );
};

export const useDeletePlaceEmail = (
) => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {_id: number}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }

            const res = await metamob.placeEmailDelete(options._id);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['places-emails']);
            }   
        }
    );
};
