import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {PetitionRequest, Petition, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../interfaces/common";

const findAll = async (filters?: Filter, orderBy?: Order, limit?: Limit): Promise<Petition[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.petitionFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findById = async (pubId: string): Promise<Petition> => {
    const res = await dchanges.petitionFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const useFindPetitionById = (
    queryKey: any[], pubId: string
): UseQueryResult<Petition, Error> => {
    return useQuery<Petition, Error>(
        queryKey, 
        () => findById(pubId)
    );
};

export const useFindPetitions = (
    queryKey: any[], filters: Filter, orderBy: Order, limit: Limit
): UseQueryResult<Petition[], Error> => {
    return useQuery<Petition[], Error>(
        queryKey, 
        () => findAll(filters, orderBy, limit)
    );

};

export const useCreatePetition = () => {
    const queryClient = useQueryClient();
    return useMutation(async (req: PetitionRequest) => {
            const res = await dchanges.petitionCreate(req);
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

export const useUpdatePetition = () => {
    const queryClient = useQueryClient();
    return useMutation(async (options: {pubId: string, req: PetitionRequest}) => {
            const res = await dchanges.petitionUpdate(options.pubId, options.req);
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

export const useDeletePetition = () => {
    const queryClient = useQueryClient();
    return useMutation(async (pubId: string) => {
            const res = await dchanges.petitionDelete(pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return {};
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries();
            }   
        }
    );
};