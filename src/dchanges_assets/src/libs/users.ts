import { Identity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import {dchanges} from "../../../declarations/dchanges";
import {DChanges, ProfileResponse, Profile, Variant} from "../../../declarations/dchanges/dchanges.did";
import { _SERVICE as Ledger } from "../../../declarations/ledger/ledger.did";
import { config } from "../config";
import { LEDGER_TRANSFER_FEE, valueToVariant } from "./backend";
import { Filter, Limit, Order } from "./common";
import { principalToAccountDefaultIdentifier, transferErrorToText } from "./icp";

const anonymous: ProfileResponse = {
    _id: 0,
    pubId: '',
    name: 'Anonymous',
    email: '',
    avatar: ['anonymous'],
    roles: [],
    countryId: 0,
};

export const findById = async (
    _id?: number
): Promise<ProfileResponse> => {
    if(!_id) {
        return anonymous;
    }

    const res = await dchanges.userFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByIdEx = async (
    main: DChanges,
    _id?: number
): Promise<Profile> => {
    if(!_id) {
        return anonymous as Profile;
    }
    
    const res = await main.userFindByIdEx(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};


export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order, 
    limit?: Limit,
    main?: DChanges
): Promise<Profile[]> => {
    if(!main) {
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
    value: string,
    main?: DChanges
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
        main
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

export const isAdmin = (
    user: ProfileResponse
): boolean => {
    if(user.roles.length === 0) {
        return false;
    }
    
    if(user.roles.find(r => 'admin' in r)) {
        return true;
    }

    return false;
}

export const isModerator = (
    user: ProfileResponse
): boolean => {
    if(user.roles.length === 0) {
        return false;
    }
    
    if(user.roles.find(r => 'admin' in r || 'moderator' in r)) {
        return true;
    }

    return false;
}

export const getAccountId = async (
    main: DChanges
): Promise<Uint8Array> => {
    const res = await main.userGetAccountId();
    return Uint8Array.from(res);
}

export const getBalance = async (
    identity: Identity,
    ledger: Ledger
): Promise<bigint> => {
    const principal = identity.getPrincipal();
    
    const res = await ledger.account_balance({
        account: Array.from(principalToAccountDefaultIdentifier(principal))
    });

    return res.e8s;
};

export const depositIcp = async (
    user: ProfileResponse,
    amount: bigint,
    main: DChanges,
    ledger: Ledger
): Promise<bigint> => {
    const userSubAccount = await getAccountId(main);

    const res = await ledger.transfer({
        to: Array.from(userSubAccount),
        amount: {e8s: amount},
        fee: {e8s: LEDGER_TRANSFER_FEE},
        memo: BigInt(user._id),
        from_subaccount: [],
        created_at_time: []
    });

    if('Err' in res) {
        throw Error(`Transfer failed: ${transferErrorToText(res.Err)}`);
    }

    return res.Ok;
};