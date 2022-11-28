import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Metamob, Notification} from "../../../declarations/metamob/metamob.did";
import { Limit, Order } from '../libs/common';
import { findByUser, findByPubId, countUnreadByUser } from '../libs/notifications';
import { useActors } from './actors';

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
    limit: Limit
): UseQueryResult<Notification[], Error> => {
    const {metamob} = useActors();
    
    return useQuery<Notification[], Error>(
        metamob? ['notifications', ...orderBy, limit.offset, limit.size]: ['notifications-empty'], 
        () => findByUser(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useCountUnreadNotificationsByUser = (
): UseQueryResult<number, Error> => {
    const {metamob} = useActors();
    return useQuery<number, Error>(
        metamob? ['notifications-unread']: ['notifications-unread-empty'], 
        () => countUnreadByUser(metamob)
    );
};

export const useMarkAsReadNotification = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.notificationMarkAsRead(options.pubId);
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
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {pubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.notificationDelete(options.pubId);
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