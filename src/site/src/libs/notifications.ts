import {Notification, Metamob} from "../../../declarations/metamob/metamob.did";
import { Limit, Order } from "./common";

export const findByUser = async (
    orderBy: Order[], 
    limit: Limit,
    metamob?: Metamob
): Promise<Notification[]> => {
    if(!metamob) {
        return [];
    }
    
    const res = await metamob.notificationFindByUser(
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
    metamob?: Metamob
): Promise<number> => {
    if(!metamob) {
        return 0;
    }
    
    const res = await metamob.notificationCountUnreadByUser();
    
    if('err' in res) {
        if(res.err === 'Not found') {
            return 0;
        }
        throw new Error(res.err);
    }

    return res.ok; 
}

export const findByPubId = async (
    pubId?: string,
    metamob?: Metamob
): Promise<Notification> => {
    if(!metamob || !pubId) {
        return {} as Notification;
    }

    const res = await metamob.notificationFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};