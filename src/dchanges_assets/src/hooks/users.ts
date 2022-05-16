import {useMutation, useQuery, useQueryClient, UseQueryResult} from 'react-query'
import {DChanges, ProfileResponse, Profile, ProfileRequest} from "../../../declarations/dchanges/dchanges.did";
import { Filter, Limit, Order } from '../libs/common';
import { findById, findAll, findByIdEx } from '../libs/users';

export const useFindUserById = (
    queryKey: any[], _id: number, main?: DChanges
): UseQueryResult<ProfileResponse|Profile, Error> => {
    return useQuery<ProfileResponse|Profile, Error>(
        queryKey, 
        () => main? findByIdEx(main, _id): findById(_id)
    );
};

export const useFindUsers = (
    queryKey: any[], filters: Filter[], orderBy: Order, limit: Limit, main?: DChanges
): UseQueryResult<Profile[], Error> => {
    if(!main) {
        throw Error('Main actor undefined');
    }
    
    return useQuery<Profile[], Error>(
        queryKey, 
        () => findAll(main, filters, orderBy, limit)
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
                queryClient.invalidateQueries();
            }   
        }
    );
};
