import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {Profile} from "../../../declarations/dchanges/dchanges.did";

const findById = async (_id: number): Promise<Profile> => {
    const res = await dchanges.userFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const useFindUserById = (
    queryKey: any[], _id: number
): UseQueryResult<Profile, Error> => {
    return useQuery<Profile, Error>(
        queryKey, 
        () => findById(_id)
    );
};

