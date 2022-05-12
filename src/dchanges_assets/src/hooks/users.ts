import {useQuery, UseQueryResult} from 'react-query'
import {ProfileResponse} from "../../../declarations/dchanges/dchanges.did";
import { findById } from '../libs/users';

export const useFindUserById = (
    queryKey: any[], _id: number
): UseQueryResult<ProfileResponse, Error> => {
    return useQuery<ProfileResponse, Error>(
        queryKey, 
        () => findById(_id)
    );
};

