import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {SignatureRequest, DChanges, SignatureResponse, Signature} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/signatures';

export const useFindSignatureById = (
    _id: number, 
    main?: DChanges
): UseQueryResult<Signature, Error> => {
    return useQuery<Signature, Error>(
        ['signatures', _id], 
        () => findById(_id, main)
    );
};

export const useFindSignatureByPubId = (
    pubId: string
): UseQueryResult<SignatureResponse, Error> => {
    return useQuery<SignatureResponse, Error>(
        ['signatures', pubId], 
        () => findByPubId(pubId)
    );
};

export const useFindSignatures = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<SignatureResponse[], Error> => {
    return useQuery<SignatureResponse[], Error>(
        ['signatures', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindSignaturesByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<SignatureResponse[], Error> => {
    return useQuery<SignatureResponse[], Error>(
        ['signatures', topicId, ...orderBy, limit.offset, limit.size], 
        () => findByCampaign(topicId, orderBy, limit)
    );

};

export const useFindSignatureByCampaignAndUser = (
    topicId?: number, 
    userId?: number
): UseQueryResult<SignatureResponse, Error> => {
    return useQuery<SignatureResponse, Error>(
        ['signatures', topicId, userId], 
        () => findByCampaignAndUser(topicId, userId)
    );

};

export const useFindUserSignatures = (
    userId: number, 
    orderBy: Order[], 
    limit: Limit,
    main?: DChanges
): UseQueryResult<SignatureResponse[], Error> => {
   return useQuery<SignatureResponse[], Error>(
        ['signatures', userId, ...orderBy, limit.offset, limit.size], 
        () => userId === 0? []: findByUser(userId, orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
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
                queryClient.invalidateQueries(['signatures']);
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
                queryClient.invalidateQueries(['signatures']);
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
                queryClient.invalidateQueries(['signatures']);
            }   
        }
    );
};