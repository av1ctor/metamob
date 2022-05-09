import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {SignatureRequest, Signature, Variant, DChanges} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";

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

const findByCampaign = async (topicId: number, orderBy?: Order, limit?: Limit): Promise<Signature[]> => {
    const res = await dchanges.signatureFindByCampaign(
        topicId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findByCampaignAndUser = async (topicId: number, userId: number): Promise<Signature> => {
    if(topicId === -1 || userId === -1) {
        return {} as Signature;
    }
    
    const res = await dchanges.signatureFindByCampaignAndUser(
        topicId, 
        userId);
    
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

export const useFindSignaturesByCampaign = (
    queryKey: any[], topicId: number, orderBy: Order, limit: Limit
): UseQueryResult<Signature[], Error> => {
    return useQuery<Signature[], Error>(
        queryKey, 
        () => findByCampaign(topicId, orderBy, limit)
    );

};

export const useFindSignatureByCampaignAndUser = (
    queryKey: any[], topicId: number, userId: number
): UseQueryResult<Signature, Error> => {
    return useQuery<Signature, Error>(
        queryKey, 
        () => findByCampaignAndUser(topicId, userId)
    );

};

export const useCreateSignature = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: SignatureRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.signatureCreate(options.req);
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
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: SignatureRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.signatureUpdate(options.pubId, options.req);
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
    return useMutation(
        async (options: {main?: DChanges, pubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.signatureDelete(options.pubId);
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