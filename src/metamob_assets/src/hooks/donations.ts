import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {DonationRequest, Metamob, DonationResponse, Donation} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/donations';

export const useFindDonationById = (
    _id: number, 
    main?: Metamob
): UseQueryResult<Donation, Error> => {
    return useQuery<Donation, Error>(
        ['donations', _id], 
        () => findById(_id, main)
    );
};

export const useFindDonationByPubId = (
    pubId: string
): UseQueryResult<DonationResponse, Error> => {
    return useQuery<DonationResponse, Error>(
        ['donations', pubId], 
        () => findByPubId(pubId)
    );
};

export const useFindDonations = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<DonationResponse[], Error> => {
    return useQuery<DonationResponse[], Error>(
        ['donations', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindDonationsByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<DonationResponse[], Error> => {
    return useInfiniteQuery<DonationResponse[], Error>(
        ['donations', topicId, ...orderBy], 
        ({ pageParam = 0 }) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}),
        {
            getNextPageParam: (lastPage, pages) => 
                lastPage.length < size? 
                undefined: 
                pages.length * size,
        }
    );
};

export const useFindDonationByCampaignAndUser = (
    topicId?: number, 
    userId?: number
): UseQueryResult<DonationResponse, Error> => {
    return useQuery<DonationResponse, Error>(
        ['donations', topicId, userId], 
        () => findByCampaignAndUser(topicId, userId)
    );

};

export const useFindUserDonations = (
    userId: number, 
    orderBy: Order[], 
    limit: Limit,
    main?: Metamob
): UseQueryResult<DonationResponse[], Error> => {
   return useQuery<DonationResponse[], Error>(
        ['donations', userId, ...orderBy, limit.offset, limit.size], 
        () => userId === 0? []: findByUser(userId, orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );

};

export const useCreateDonation = () => {
    return useMutation(
        async (options: {main?: Metamob, req: DonationRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.donationCreate(options.req);
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

export const useCompleteDonation = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, campaignPubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.donationComplete(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['donations']);
                queryClient.invalidateQueries(['campaigns', variables.campaignPubId]);
            }   
        }
    );
};

export const useUpdateDonation = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: DonationRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.donationUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['donations']);
            }   
        }
    );
};

export const useDeleteDonation = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, campaignPubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.donationDelete(options.pubId);
            if('err' in res) {
                throw new Error(res.err);
            }
            return {};
        },
        {
            onSuccess: (data, variables) => {
                queryClient.invalidateQueries(['donations']);
                queryClient.invalidateQueries(['campaigns', variables.campaignPubId]);
            }   
        }
    );
};