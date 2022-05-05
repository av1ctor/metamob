import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {SignatureRequest, Signature, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../interfaces/common";

const findAll = async (filters?: Filter, orderBy?: Order, limit?: Limit): Promise<Signature[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.signatureFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findByPetition = async (topicId: number, orderBy?: Order, limit?: Limit): Promise<Signature[]> => {
    const res = await dchanges.signatureFindByPetition(
        topicId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findById = async (pubId: string): Promise<Signature> => {
    const res = await dchanges.signatureFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const useFindSignatureById = (
    queryKey: any[], pubId: string
): UseQueryResult<Signature, Error> => {
    return useQuery<Signature, Error>(
        queryKey, 
        () => findById(pubId)
    );
};

export const useFindSignatures = (
    queryKey: any[], filters: Filter, orderBy: Order, limit: Limit
): UseQueryResult<Signature[], Error> => {
    return useQuery<Signature[], Error>(
        queryKey, 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindSignaturesByPetition = (
    queryKey: any[], topicId: number, orderBy: Order, limit: Limit
): UseQueryResult<Signature[], Error> => {
    return useQuery<Signature[], Error>(
        queryKey, 
        () => findByPetition(topicId, orderBy, limit)
    );

};

export const useCreateSignature = () => {
    const queryClient = useQueryClient();
    return useMutation(async (req: SignatureRequest) => {
            const res = await dchanges.signatureCreate(req);
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

export const useUpdateSignature = () => {
    const queryClient = useQueryClient();
    return useMutation(async (options: {pubId: string, req: SignatureRequest}) => {
            const res = await dchanges.signatureUpdate(options.pubId, options.req);
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

export const useDeleteSignature = () => {
    const queryClient = useQueryClient();
    return useMutation(async (pubId: string) => {
            const res = await dchanges.signatureDelete(pubId);
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