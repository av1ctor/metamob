import {useMutation, useQuery, useQueryClient, UseQueryResult} from 'react-query'
import {DChanges, ProfileResponse, Profile, ProfileRequest} from "../../../declarations/dchanges/dchanges.did";
import { Filter, Limit, Order } from '../libs/common';
import { findById, findAll, findByIdEx } from '../libs/users';

export const useFindUserById = (
    _id: number, 
    main?: DChanges
): UseQueryResult<ProfileResponse|Profile, Error> => {
    return useQuery<ProfileResponse|Profile, Error>(
        ['users', main? 'full': 'redacted', _id],
        () => main? findByIdEx(main, _id): findById(_id)
    );
};

export const useFindUsers = (
    filters: Filter[], 
    orderBy: Order, 
    limit: Limit, 
    main?: DChanges
): UseQueryResult<Profile[], Error> => {
    return useQuery<Profile[], Error>(
        ['users', ...filters, orderBy.key, orderBy.dir, limit.offset, limit.size],
        () => findAll(filters, orderBy, limit, main)
    );
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: ProfileRequest}) => {
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
