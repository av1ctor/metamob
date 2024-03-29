import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {Notification} from "../../../declarations/metamob/metamob.did";
import { Limit, Order } from '../libs/common';
import { findByUser, findByPubId, countUnreadByUser } from '../libs/notifications';
import { useActors } from './actors';
import { useAuth } from './auth';

export const useFindNotificationByPubId = (
    pubId: string
): UseQueryResult<Notification, Error> => {
    const {metamob} = useActors();

    return useQuery<Notification, Error>(
        ['notifications', pubId], 
        () => findByPubId(pubId, metamob)
    );
};

export const useFindNotificationsByUser = (
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Notification[], Error> => {
    const {user} = useAuth();
    const {metamob} = useActors();
    
    return useQuery<Notification[], Error>(
        metamob? 
            ['notifications', user?._id, ...orderBy, limit.offset, limit.size]: 
            ['notifications-empty'], 
        () => findByUser(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useCountUnreadNotificationsByUser = (
): UseQueryResult<number, Error> => {
    const {user} = useAuth();
    const {metamob} = useActors();
    return useQuery<number, Error>(
        metamob? 
            ['notifications-unread', user?._id]: 
            ['notifications-unread-empty'], 
        () => countUnreadByUser(metamob)
    );
};

export const useMarkAsReadNotification = () => {
    const queryClient = useQueryClient();
    const {user} = useAuth();
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
                queryClient.invalidateQueries(['notifications', user?._id]);
                queryClient.invalidateQueries(['notifications-unread']);
            }   
        }
    );
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    const {user} = useAuth();
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
                queryClient.invalidateQueries(['notifications', user?._id]);
                queryClient.invalidateQueries(['notifications-unread']);
            }   
        }
    );
};