import {useQuery, UseQueryResult, useMutation, useQueryClient, UseInfiniteQueryResult, useInfiniteQuery} from 'react-query'
import {FundingRequest, FundingResponse, Funding, ModerationRequest} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findByCampaign, findByCampaignAndUser, findById, findByPubId, findByUser } from '../libs/fundings';
import { useActors } from './actors';

export const useFindFundingById = (
    _id: number
): UseQueryResult<Funding, Error> => {
    const {metamob} = useActors();

    return useQuery<Funding, Error>(
        ['fundings', _id], 
        () => findById(_id, metamob)
    );
};

export const useFindFundingByPubId = (
    pubId: string
): UseQueryResult<FundingResponse, Error> => {
    const {metamob} = useActors();

    return useQuery<FundingResponse, Error>(
        ['fundings', pubId], 
        () => findByPubId(pubId, metamob)
    );
};

export const useFindFundings = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<FundingResponse[], Error> => {
    const {metamob} = useActors();

    return useQuery<FundingResponse[], Error>(
        ['fundings', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit, metamob)
    );

};

export const useFindFundingsByCampaign = (
    topicId: number, 
    orderBy: Order[], 
    size: number
): UseInfiniteQueryResult<FundingResponse[], Error> => {
    const {metamob} = useActors();

    return useInfiniteQuery<FundingResponse[], Error>(
        ['fundings', topicId, ...orderBy], 
        ({ pageParam = 0 }) => findByCampaign(topicId, orderBy, {offset: pageParam, size: size}, metamob),
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
    const {metamob} = useActors();

    return useQuery<FundingResponse, Error>(
        ['fundings', topicId, userId], 
        () => findByCampaignAndUser(topicId, userId, metamob)
    );

};

export const useFindUserFundings = (
    orderBy: Order[], 
    limit: Limit,
    userId?: number
): UseQueryResult<FundingResponse[], Error> => {
    const {metamob} = useActors();

   return useQuery<FundingResponse[], Error>(
        ['fundings', userId, ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );

};

export const useCreateFunding = () => {
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: FundingRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.fundingCreate(options.req);
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
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {pubId: string, campaignPubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.fundingComplete(options.pubId);
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: FundingRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.fundingUpdate(options.pubId, options.req);
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

export const useModerateFunding = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: FundingRequest, mod: ModerationRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.fundingModerate(options.pubId, options.req, options.mod);
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
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {pubId: string, campaignPubId: string}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.fundingDelete(options.pubId);
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