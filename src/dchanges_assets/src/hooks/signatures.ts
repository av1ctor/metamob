import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {SignatureRequest, DChanges, SignatureResponse} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById } from '../libs/signatures';

export const useFindSignatureById = (
    queryKey: any[], pubId: string
): UseQueryResult<SignatureResponse, Error> => {
    return useQuery<SignatureResponse, Error>(
        queryKey, 
        () => findById(pubId)
    );
};

export const useFindSignatures = (
    queryKey: any[], filters: Filter[], orderBy: Order, limit: Limit
): UseQueryResult<SignatureResponse[], Error> => {
    return useQuery<SignatureResponse[], Error>(
        queryKey, 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindSignaturesByCampaign = (
    queryKey: any[], topicId: number, orderBy: Order, limit: Limit
): UseQueryResult<SignatureResponse[], Error> => {
    return useQuery<SignatureResponse[], Error>(
        queryKey, 
        () => findByCampaign(topicId, orderBy, limit)
    );

};

export const useFindSignatureByCampaignAndUser = (
    queryKey: any[], topicId?: number, userId?: number
): UseQueryResult<SignatureResponse, Error> => {
    return useQuery<SignatureResponse, Error>(
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