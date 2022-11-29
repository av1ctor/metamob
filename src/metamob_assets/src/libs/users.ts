import { Identity } from "@dfinity/agent";
import {metamob} from "../../../declarations/metamob";
import {Metamob, ProfileResponse, Profile, Variant} from "../../../declarations/metamob/metamob.did";
import { _SERVICE as Ledger } from "../../../declarations/ledger/ledger.did";
import { LEDGER_TRANSFER_FEE, valueToVariant } from "./backend";
import { Filter, Limit, Order } from "./common";
import { principalToAccountDefaultIdentifier, transferErrorToText } from "./icp";

export enum Banned {
    None = 0,
    AsAdmin = 2,
    AsModerator = 4,
    AsUser = 8,
} 

const anonymous: ProfileResponse = {
    _id: 0,
    pubId: '',
    name: 'Anonymous',
    email: '',
    avatar: ['rapper2'],
    roles: [],
    country: 'US',
    moderated: 0,
};

export const findById = async (
    _id?: number
): Promise<ProfileResponse> => {
    if(!_id) {
        return anonymous;
    }

    const res = await metamob.userFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByIdEx = async (
    metamob: Metamob,
    _id?: number
): Promise<Profile> => {
    if(!_id) {
        return anonymous as Profile;
    }
    
    const res = await metamob.userFindByIdEx(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string
): Promise<ProfileResponse> => {
    if(!pubId) {
        return anonymous;
    }

    const res = await metamob.userFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<Profile[]> => {
    if(!metamob) {
        return [];
    }    

    const criterias: [] | [Array<[string, string, Variant]>] = filters?
        [
            filters
                .filter(filter => filter.value !== null && filter.value !== '')
                .map(filter => [
                    filter.key, 
                    filter.op, 
                    valueToVariant(filter.value)
                ])
        ]:
        [];

    const res = await metamob.userFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: [[0n, 20n]]);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};

export const search = async (
    value: string,
    metamob?: Metamob
): Promise<{name: string, value: number}[]> => {
    const users = await findAll(
        [
            {
                key: 'name',
                op: 'contains',
                value: value
            }
        ],
        undefined,
        undefined,
        metamob
    );

    return users.map(u => ({
        name: u.name,
        value: u._id
    }));
};

export const isAdmin = (
    user?: ProfileResponse
): boolean => {
    if(!user || user.roles.length === 0) {
        return false;
    }
    
    if(user.roles.find(r => 'admin' in r)) {
        return true;
    }

    return false;
}

export const isModerator = (
    user?: ProfileResponse
): boolean => {
    if(!user || user.roles.length === 0) {
        return false;
    }
    
    if(user.roles.find(r => 'admin' in r || 'moderator' in r)) {
        return true;
    }

    return false;
}

export const getAccountId = async (
    metamob: Metamob
): Promise<Uint8Array> => {
    const res = await metamob.userGetAccountId();
    return Uint8Array.from(res);
}
