import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {DonationRequest, DChanges, DonationResponse, Donation} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/donations';

export const useFindDonationById = (
    _id: number, 
    main?: DChanges
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
    orderBy: Order, 
    limit: Limit
): UseQueryResult<DonationResponse[], Error> => {
    return useQuery<DonationResponse[], Error>(
        ['donations', ...filters, orderBy.key, orderBy.dir, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindDonationsByCampaign = (
    topicId: number, 
    orderBy: Order, 
    limit: Limit
): UseQueryResult<DonationResponse[], Error> => {
    return useQuery<DonationResponse[], Error>(
        ['donations', topicId, orderBy.key, orderBy.dir, limit.offset, limit.size], 
        () => findByCampaign(topicId, orderBy, limit)
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
    orderBy: Order, 
    limit: Limit,
    main?: DChanges
): UseQueryResult<DonationResponse[], Error> => {
   return useQuery<DonationResponse[], Error>(
        ['donations', userId, orderBy.key, orderBy.dir, limit.offset, limit.size], 
        () => userId === 0? []: findByUser(userId, orderBy, limit, main)
    );

};

export const useCreateDonation = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: DonationRequest}) => {
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
                queryClient.invalidateQueries(['donations']);
            }   
        }
    );
};

export const useUpdateDonation = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: DonationRequest}) => {
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
        async (options: {main?: DChanges, pubId: string}) => {
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
            onSuccess: () => {
                queryClient.invalidateQueries(['donations']);
            }   
        }
    );
};