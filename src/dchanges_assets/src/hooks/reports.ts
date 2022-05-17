import {useQuery, UseQueryResult, useMutation, useQueryClient, QueryObserverLoadingErrorResult} from 'react-query'
import {ReportRequest, Report, DChanges, ReportCloseRequest} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findById } from '../libs/reports';

export const useFindReportById = (
    queryKey: any[], 
    pubId: string, 
    main?: DChanges
): UseQueryResult<Report, Error> => {
    if(!main) {
        throw Error('Main actor undefined');
    }
    
    return useQuery<Report, Error>(
        queryKey, 
        () => findById(pubId, main)
    );
};

export const useFindReports = (
    queryKey: any[], 
    filters: Filter[], 
    orderBy: Order, 
    limit: Limit, 
    main?: DChanges
): UseQueryResult<Report[], Error> => {
    if(!main) {
        throw Error('Main actor undefined');
    }
    
    return useQuery<Report[], Error>(
        queryKey, 
        () => findAll(main, filters, orderBy, limit)
    );
};

export const useCreateReport = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, req: ReportRequest}) => {
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
                queryClient.invalidateQueries();
            }   
        }
    );
};

export const useUpdateReport = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: ReportRequest}) => {
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
                queryClient.invalidateQueries();
            }   
        }
    );
};

export const useCloseReport = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string, req: ReportCloseRequest}) => {
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
                queryClient.invalidateQueries();
            }   
        }
    );
};

export const useAssignReport = () => {
    const queryClient = useQueryClient();
    return useMutation(
        async (options: {main?: DChanges, pubId: string, userId: number}) => {
            if(!options.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await options.main.reportAssign(options.pubId, options.userId);
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
