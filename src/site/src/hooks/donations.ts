import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {DonationRequest, Metamob, DonationResponse, Donation, ModerationRequest} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/donations';
import { useActors } from './actors';

export const useFindDonationById = (
    _id: number
): UseQueryResult<Donation, Error> => {
    const {metamob} = useActors();

    return useQuery<Donation, Error>(
        ['donations', _id], 
        () => findById(_id, metamob)
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
    orderBy: Order[], 
    limit: Limit,
    userId?: number
): UseQueryResult<DonationResponse[], Error> => {
    const {metamob} = useActors();

   return useQuery<DonationResponse[], Error>(
        ['donations', userId, ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );

};

export const useCreateDonation = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {req: DonationRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.donationCreate(options.req);
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

export const useCompleteDonation = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, campaignPubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.donationComplete(options.pubId);
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: DonationRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.donationUpdate(options.pubId, options.req);
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

export const useModerateDonation = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: DonationRequest, mod: ModerationRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.donationModerate(options.pubId, options.req, options.mod);
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
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {pubId: string, campaignPubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.donationDelete(options.pubId);
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