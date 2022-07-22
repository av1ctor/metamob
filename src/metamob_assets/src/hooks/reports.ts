import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {ReportRequest, ReportResponse, Metamob, ReportCloseRequest} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findById, findByReportedUser, findByUser } from '../libs/reports';

export const useFindReportById = (
    pubId: string, 
    main?: Metamob
): UseQueryResult<ReportResponse, Error> => {
    return useQuery<ReportResponse, Error>(
        ['reports', pubId], 
        () => findById(pubId, main)
    );
};

export const useFindReports = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit, 
    main?: Metamob
): UseQueryResult<ReportResponse[], Error> => {
    return useQuery<ReportResponse[], Error>(
        ['reports', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindReportsAssigned = (
    userId: number,
    orderBy: Order[], 
    limit: Limit, 
    main?: Metamob
): UseQueryResult<ReportResponse[], Error> => {
    const filters: Filter[] = [
        {
            key: 'assignedTo',
            op: 'eq',
            value: userId
        }
    ];
    
    return useQuery<ReportResponse[], Error>(
        ['reports', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindUserReports = (
    orderBy: Order[], 
    limit: Limit, 
    userId?: number,
    main?: Metamob
): UseQueryResult<ReportResponse[], Error> => {
    return useQuery<ReportResponse[], Error>(
        ['reports', userId, ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindAgainstUserReports = (
    orderBy: Order[], 
    limit: Limit, 
    userId?: number,
    main?: Metamob
): UseQueryResult<ReportResponse[], Error> => {
    return useQuery<ReportResponse[], Error>(
        ['reports-against', userId, ...orderBy, limit.offset, limit.size], 
        () => findByReportedUser(orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useCreateReport = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, req: ReportRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
                
            const res = await options.main.reportCreate(options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['reports']);
            }   
        }
    );
};

export const useUpdateReport = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: ReportRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.reportUpdate(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['reports']);
            }   
        }
    );
};

export const useCloseReport = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: Metamob, pubId: string, req: ReportCloseRequest}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.reportClose(options.pubId, options.req);
            if('err' in res) {
                throw new Error(res.err);
            }
            return res.ok;
        },
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['reports']);
            }   
        }
    );
};
