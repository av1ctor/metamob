import {metamob} from "../../../declarations/metamob";
import {Notification, Metamob} from "../../../declarations/metamob/metamob.did";
import { Limit, Order } from "./common";

export const findByUser = async (
    orderBy: Order[], 
    limit: Limit,
    main?: Metamob
): Promise<Notification[]> => {
    if(!main) {
        return [];
    }
    
    const res = await main.notificationFindByUser(
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []
    );
    
    if('err' in res) {
        if(res.err === 'Not found') {
            return [];
        }
        throw new Error(res.err);
    }

    return res.ok; 
}

export const countUnreadByUser = async (
    main?: Metamob
): Promise<number> => {
    if(!main) {
        return 0;
    }
    
    const res = await main.notificationCountUnreadByUser();
    
    if('err' in res) {
        if(res.err === 'Not found') {
            return 0;
        }
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByPubId = async (
    pubId?: string
): Promise<Notification> => {
    if(!pubId) {
        return {} as Notification;
    }

    const res = await metamob.notificationFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};