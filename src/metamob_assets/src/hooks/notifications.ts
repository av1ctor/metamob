import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Metamob, Notification} from "../../../declarations/metamob/metamob.did";
import { Limit, Order } from '../libs/common';
import { findByUser, findByPubId, countUnreadByUser } from '../libs/notifications';

export const useFindNotificationByPubId = (
    pubId: string
): UseQueryResult<Notification, Error> => {
    return useQuery<Notification, Error>(
        ['notifications', pubId], 
        () => findByPubId(pubId)
    );
};

export const useFindNotificationsByUser = (
    orderBy: Order[], 
    limit: Limit,
    main?: Metamob
): UseQueryResult<Notification[], Error> => {
   return useQuery<Notification[], Error>(
        main? ['notifications', ...orderBy, limit.offset, limit.size]: ['notifications-empty'], 
        () => findByUser(orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useCountUnreadNotificationsByUser = (
    main?: Metamob
): UseQueryResult<number, Error> => {
   return useQuery<number, Error>(
        main? ['notifications-unread']: ['notifications-unread-empty'], 
        () => countUnreadByUser(main)
    );
};

export const useMarkAsReadNotification = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.notificationMarkAsRead(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['notifications']);
                queryClient.invalidateQueries(['notifications-unread']);
            }   
        }
    );
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.notificationDelete(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return {};
        },
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['notifications']);
                queryClient.invalidateQueries(['notifications-unread']);
            }   
        }
    );
};