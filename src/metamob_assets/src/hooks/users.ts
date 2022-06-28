import { Principal } from '@dfinity/principal';
import {useMutation, useQuery, useQueryClient, UseQueryResult} from 'react-query'
import {Metamob, ProfileResponse, Profile, ProfileRequest} from "../../../declarations/metamob/metamob.did";
import {canisterId as metamobCanisterId} from "../../../declarations/metamob";
import { _SERVICE as MMT } from "../../../declarations/mmt/mmt.did";
import { Filter, Limit, Order } from '../libs/common';
import { findById, findAll, findByIdEx } from '../libs/users';

export const useFindUserById = (
    _id?: number, 
    main?: Metamob
): UseQueryResult<ProfileResponse|Profile, Error> => {
    return useQuery<ProfileResponse|Profile, Error>(
        ['users', main? 'full': 'redacted', _id],
        () => main? findByIdEx(main, _id): findById(_id)
    );
};

export const useFindUsers = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit, 
    main?: Metamob
): UseQueryResult<Profile[], Error> => {
    return useQuery<Profile[], Error>(
        ['users', ...filters, ...orderBy, limit.offset, limit.size],
        () => findAll(filters, orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: ProfileRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.userUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['users']);
            }   
        }
    );
};

export const useSignupAsModerator = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.userSignupAsModerator();
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['users']);
            }   
        }
    );
};

export const useStake = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {value: bigint, mmt?: MMT, main?: Metamob}) => {
            if(!options.main || !metamobCanisterId) {
                throw Error('Main actor undefined');
            }

            if(!options.mmt) {
                throw Error('MMT actor undefined');
            }
            
            const res = await options.mmt.approve(
                Principal.fromText(metamobCanisterId), options.value);
            if(res && 'Err' in res) {
                throw new Error(JSON.stringify(res.Err));
            }

            const res2 = await options.main.daoStake(options.value);
            if('err' in res2) {
                throw new Error(res2.err);
            }
            
            return;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['users']);
            }   
        }
    );
};

export const useWithdraw = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {value: bigint, main?: Metamob}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.daoWithdraw(options.value);
            if('err' in res) {
                throw new Error(res.err);
            }
            
            return;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['users']);
            }   
        }
    );
};

export const useTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {to: string, value: bigint, mmt?: MMT}) => {
            if(!options.mmt) {
                throw Error('MMT actor undefined');
            }

            const res = await options.mmt.transfer( 
                Principal.fromText(options.to), options.value);
            if(res && 'Err' in res) {
                throw new Error(JSON.stringify(res.Err));
            }
            
            return;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['users']);
            }   
        }
    );
};
