import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {ProfileResponse} from "../../../declarations/dchanges/dchanges.did";

const findById = async (_id: number): Promise<ProfileResponse> => {
    const res = await dchanges.userFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const useFindUserById = (
    queryKey: any[], _id: number
): UseQueryResult<ProfileResponse, Error> => {
    return useQuery<ProfileResponse, Error>(
        queryKey, 
        () => findById(_id)
    );
};

