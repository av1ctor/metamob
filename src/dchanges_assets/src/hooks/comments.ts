import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {dchanges} from "../../../declarations/dchanges";
import {CommentRequest, Comment, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../interfaces/common";

const findAll = async (filters?: Filter, orderBy?: Order, limit?: Limit): Promise<Comment[]> => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.commentFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findByPetition = async (topicId: number, orderBy?: Order, limit?: Limit): Promise<Comment[]> => {
    const res = await dchanges.commentFindByPetition(
        topicId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

const findById = async (pubId: string): Promise<Comment> => {
    const res = await dchanges.commentFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const useFindCommentById = (
    queryKey: any[], pubId: string
): UseQueryResult<Comment, Error> => {
    return useQuery<Comment, Error>(
        queryKey, 
        () => findById(pubId)
    );
};

export const useFindComments = (
    queryKey: any[], filters: Filter, orderBy: Order, limit: Limit
): UseQueryResult<Comment[], Error> => {
    return useQuery<Comment[], Error>(
        queryKey, 
        () => findAll(filters, orderBy, limit)
    );

};

export const useFindCommentsByPetition = (
    queryKey: any[], topicId: number, orderBy: Order, limit: Limit
): UseQueryResult<Comment[], Error> => {
    return useQuery<Comment[], Error>(
        queryKey, 
        () => findByPetition(topicId, orderBy, limit)
    );

};

export const useCreateComment = () => {
    const queryClient = useQueryClient();
    return useMutation(async (req: CommentRequest) => {
            const res = await dchanges.commentCreate(req);
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

export const useUpdateComment = () => {
    const queryClient = useQueryClient();
    return useMutation(async (options: {pubId: string, req: CommentRequest}) => {
            const res = await dchanges.commentUpdate(options.pubId, options.req);
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

export const useDeleteComment = () => {
    const queryClient = useQueryClient();
    return useMutation(async (pubId: string) => {
            const res = await dchanges.commentDelete(pubId);
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