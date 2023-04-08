import {useMutation, useQuery, useQueryClient, UseQueryResult} from 'react-query'
import {ProfileResponse, Profile, ProfileRequest, ModerationRequest, VerifyRequest} from "../../../declarations/metamob/metamob.did";
import { Filter, Limit, Order } from '../libs/common';
import { findById, findAll, findByIdEx, findByPubId } from '../libs/users';
import { useActors } from './actors';

export const useFindUserById = (
    id?: number | [] | [number]
): UseQueryResult<ProfileResponse|Profile, Error> => {
    const {metamob} = useActors();
    
    const _id = Array.isArray(id)?
        id.length > 0?
            id[0]
        :
            undefined
    :
        id;
    return useQuery<ProfileResponse|Profile, Error>(
        ['users', 'redacted', _id],
        () => findById(_id, metamob)
    );
};

export const useFindUserByIdEx = (
    id?: number | [] | [number]
): UseQueryResult<ProfileResponse|Profile, Error> => {
    const {metamob} = useActors();
    
    const _id = Array.isArray(id)?
        id.length > 0?
            id[0]
        :
            undefined
    :
        id;
    return useQuery<ProfileResponse|Profile, Error>(
        ['users', metamob? 'full': 'redacted', _id],
        () => metamob? findByIdEx(metamob, _id): findById(_id)
    );
};

export const useFindUserByPubId = (
    pubId?: string,
): UseQueryResult<ProfileResponse, Error> => {
    const {metamob} = useActors();
    
    return useQuery<ProfileResponse|Profile, Error>(
        ['users', 'redacted', pubId],
        () => findByPubId(pubId, metamob)
    );
};

export const useFindUsers = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<Profile[], Error> => {
    const {metamob} = useActors();

    return useQuery<Profile[], Error>(
        ['users', ...filters, ...orderBy, limit.offset, limit.size],
        () => findAll(filters, orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useVerifyMe = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: VerifyRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.userVerifyMe(options.req);
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

export const useUpdateMe = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: ProfileRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.userUpdateMe(options.req);
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

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: ProfileRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.userUpdate(options.pubId, options.req);
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

export const useModerateUser = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: ProfileRequest, mod: ModerationRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.userModerate(options.pubId, options.req, options.mod);
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
    const {metamob} = useActors();

    return useMutation(
        async () => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.userSignupAsModerator();
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
