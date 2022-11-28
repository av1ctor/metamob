import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {ReportRequest, ReportResponse, Metamob, ReportCloseRequest} from "../../../declarations/metamob/metamob.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findById, findByReportedUser, findByUser } from '../libs/reports';
import { useActors } from './actors';

export const useFindReportById = (
    pubId: string
): UseQueryResult<ReportResponse, Error> => {
    const {metamob} = useActors();

    return useQuery<ReportResponse, Error>(
        ['reports', pubId], 
        () => findById(pubId, metamob)
    );
};

export const useFindReports = (
    filters: Filter[], 
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<ReportResponse[], Error> => {
    const {metamob} = useActors();

    return useQuery<ReportResponse[], Error>(
        ['reports', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindReportsAssigned = (
    userId: number,
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<ReportResponse[], Error> => {
    const {metamob} = useActors();

    const filters: Filter[] = [
        {
            key: 'assignedTo',
            op: 'eq',
            value: userId
        }
    ];
    
    return useQuery<ReportResponse[], Error>(
        ['reports', ...filters, ...orderBy, limit.offset, limit.size], 
        () => findAll(filters, orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindUserReports = (
    orderBy: Order[], 
    limit: Limit, 
    userId?: number
): UseQueryResult<ReportResponse[], Error> => {
    const {metamob} = useActors();

    return useQuery<ReportResponse[], Error>(
        ['reports', userId, ...orderBy, limit.offset, limit.size], 
        () => findByUser(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useFindAgainstUserReports = (
    orderBy: Order[], 
    limit: Limit, 
    userId?: number
): UseQueryResult<ReportResponse[], Error> => {
    const {metamob} = useActors();

    return useQuery<ReportResponse[], Error>(
        ['reports-against', userId, ...orderBy, limit.offset, limit.size], 
        () => findByReportedUser(orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};

export const useCreateReport = () => {
    const queryClient = useQueryClient();
    const {metamob} = useActors();

    return useMutation(
        async (options: {req: ReportRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
                
            const res = await metamob.reportCreate(options.req);
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
    const {metamob} = useActors();

    return useMutation(
        async (options: {pubId: string, req: ReportRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.reportUpdate(options.pubId, options.req);
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
    const {metamob} = useActors();
    
    return useMutation(
        async (options: {pubId: string, req: ReportCloseRequest}) => {
            if(!metamob) {
                throw Error('Main actor undefined');
            }
            
            const res = await metamob.reportClose(options.pubId, options.req);
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
