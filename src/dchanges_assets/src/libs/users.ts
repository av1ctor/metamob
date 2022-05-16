import { AuthClient } from "@dfinity/auth-client";
import {dchanges} from "../../../declarations/dchanges";
import {DChanges, ProfileResponse, Profile, Variant} from "../../../declarations/dchanges/dchanges.did";
import { config } from "../config";
import { valueToVariant } from "./backend";
import { Filter, Limit, Order } from "./common";

export const findById = async (
    _id: number
): Promise<ProfileResponse> => {
    if(_id === 0) {
        return {
            _id: 0,
            pubId: '',
            name: 'Anonymous',
            email: '',
            avatar: ['anonymous'],
            roles: [],
            countryId: 0,
        };
    }

    const res = await dchanges.userFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByIdEx = async (
    main: DChanges,
    _id: number
): Promise<Profile> => {
    const res = await main.userFindByIdEx(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};


export const findAll = async (
    main: DChanges,
    filters?: Filter[], 
    orderBy?: Order, 
    limit?: Limit
): Promise<Profile[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters?
        [filters.filter(filter => !!filter.value).map(filter => [filter.key, filter.op, valueToVariant(filter.value)])]:
        [];

    const res = await main.userFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: [[0n, 20n]]);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};

export const search = async (
    main: DChanges,
    value: string
): Promise<{name: string, value: number}[]> => {
    const users = await findAll(
        main,
        [
            {
                key: 'name',
                op: 'contains',
                value: value
            }
        ]
    );

    return users.map(u => ({
        name: u.name,
        value: u._id
    }));
};

export const loginUser = async (
    client: AuthClient, 
    onSuccess: () => void, 
    onError: (msg: string|undefined) => void
): Promise<void> => {
    const width = 500;
    const height = screen.height;
    const left = ((screen.width/2)-(width/2))|0;
    const top = ((screen.height/2)-(height/2))|0; 
    
    client.login({
        identityProvider: config.II_URL,
        windowOpenerFeatures: `toolbar=0,location=0,menubar=0,width=${width},height=${height},top=${top},left=${left}`,
        onSuccess: onSuccess,
        onError: onError,
    });

};

