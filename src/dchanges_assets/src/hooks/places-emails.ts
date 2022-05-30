import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {DChanges, PlaceEmail, PlaceEmailRequest} from "../../../declarations/dchanges/dchanges.did";
import {Limit, Order} from "../libs/common";
import { findAll } from '../libs/places-emails';

export const useFindPlacesEmails = (
    placeId: number, 
    orderBy: Order, 
    limit: Limit,
    main?: DChanges
): UseQueryResult<PlaceEmail[], Error> => {
    return useQuery<PlaceEmail[], Error>(
        ['places-emails', placeId, orderBy.key, orderBy.dir, limit.offset, limit.size], 
        () => findAll(placeId, orderBy, limit, main)
    );
};

export const useCreatePlaceEmail = (
) => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: PlaceEmailRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.placeEmailCreate(options.req);
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
    return useMutation(
        async (options: {main?: DChanges, _id: number}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.placeEmailDelete(options._id);
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
