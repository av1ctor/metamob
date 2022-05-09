import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {CampaignRequest, Campaign, Variant, DChanges} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";

const findAll = async (filters?: Filter, orderBy?: Order, limit?: Limit): Promise<Campaign[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.campaignFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findByUser = async (userId: number, orderBy?: Order, limit?: Limit): Promise<Campaign[]> => {
    const res = await dchanges.campaignFindByUser(
        userId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findById = async (pubId: string): Promise<Campaign> => {
    const res = await dchanges.campaignFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const useFindCampaignById = (
    queryKey: any[], pubId: string
): UseQueryResult<Campaign, Error> => {
    return useQuery<Campaign, Error>(
        queryKey, 
        () => findById(pubId)
    );
};

export const useFindCampaigns = (
    queryKey: any[], filters: Filter, orderBy: Order, limit: Limit
): UseQueryResult<Campaign[], Error> => {
    return useQuery<Campaign[], Error>(
        queryKey, 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindUserCampaigns = (
    userId: number, orderBy: Order, limit: Limit
): UseQueryResult<Campaign[], Error> => {
    return useQuery<Campaign[], Error>(
        ['user-campaigns', userId, orderBy.key, orderBy.dir], 
        () => userId === -1? []: findByUser(userId, orderBy, limit)
    );

};

export const useCreateCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: CampaignRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }            
            
            const res = await options.main.campaignCreate(options.req);
            
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

export const useUpdateCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: CampaignRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.campaignUpdate(options.pubId, options.req);
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

export const useDeleteCampaign = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }

            const res = await options.main.campaignDelete(options.pubId);
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