import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {FundingRequest, Metamob, FundingResponse, Funding} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/fundings';

export const useFindFundingById = (
    _id: number, 
    main?: Metamob
): UseQueryResult<Funding, Error> => {
    return useQuery<Funding, Error>(
        ['fundings', _id], 
        () => findById(_id, main)
    );
};

export const useFindFundingByPubId = (
    pubId: string
): UseQueryResult<FundingResponse, Error> => {
    return useQuery<FundingResponse, Error>(
        ['fundings', pubId], 
        () => findByPubId(pubId)
    );
};

export const useFindFundings = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<FundingResponse[], Error> => {
    return useQuery<FundingResponse[], Error>(
        ['fundings', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindFundingsByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<FundingResponse[], Error> => {
    return useInfiniteQuery<FundingResponse[], Error>(
        ['fundings', topicId, ...orderBy], 
        ({ pageParam = 0 }) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}),
        {
            getNextPageParam: (lastPage, pages) => 
                lastPage.length < size? 
                undefined: 
                pages.length * size,
        }
    );
};

export const useFindFundingByCampaignAndUser = (
    topicId?: number, 
    userId?: number
): UseQueryResult<FundingResponse, Error> => {
    return useQuery<FundingResponse, Error>(
        ['fundings', topicId, userId], 
        () => findByCampaignAndUser(topicId, userId)
    );

};

export const useFindUserFundings = (
    userId: number, 
    orderBy: Order[], 
    limit: Limit,
    main?: Metamob
): UseQueryResult<FundingResponse[], Error> => {
   return useQuery<FundingResponse[], Error>(
        ['fundings', userId, ...orderBy, limit.offset, limit.size], 
        () => userId === 0? []: findByUser(userId, orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );

};

export const useCreateFunding = () => {
    return useMutation(
        async (options: {main?: Metamob, req: FundingRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.fundingCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
            }   
        }
    );
};

export const useCompleteFunding = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, campaignPubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.fundingComplete(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['fundings']);
                queryClient.invalidateQueries(['campaigns', variables.campaignPubId]);
            }   
        }
    );
};

export const useUpdateFunding = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: FundingRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.fundingUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['fundings']);
            }   
        }
    );
};

export const useDeleteFunding = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, campaignPubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.fundingDelete(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return {};
        },
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['fundings']);
                queryClient.invalidateQueries(['campaigns', variables.campaignPubId]);
            }   
        }
    );
};