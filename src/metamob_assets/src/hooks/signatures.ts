import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {SignatureRequest, Metamob, SignatureResponse, Signature} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/signatures';

export const useFindSignatureById = (
    _id: number, 
    main?: Metamob
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
    size: number
): UseInfiniteQueryResult<SignatureResponse[], Error> => {
    return useInfiniteQuery<SignatureResponse[], Error>(
        ['signatures', topicId, ...orderBy], 
        ({pageParam = 0}) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}),
        {
            getNextPageParam: (lastPage, pages) => 
                lastPage.length < size?
                    undefined:
                pages.length * size
        }
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
    main?: Metamob
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
        async (options: {main?: Metamob, req: SignatureRequest}) => {
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
        async (options: {main?: Metamob, pubId: string, req: SignatureRequest}) => {
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
        async (options: {main?: Metamob, pubId: string}) => {
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