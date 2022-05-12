import {useQuery, UseQueryResult, useMutation, useQueryClient} from 'react-query'
import {ReportRequest, Report, DChanges} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "../libs/common";
import { findAll, findById } from '../libs/reports';

export const useFindReportById = (
    queryKey: any[], pubId: string
): UseQueryResult<Report, Error> => {
    return useQuery<Report, Error>(
        queryKey, 
        () => findById(pubId)
    );
};

export const useFindReports = (
    queryKey: any[], filters: Filter, orderBy: Order, limit: Limit
): UseQueryResult<Report[], Error> => {
    return useQuery<Report[], Error>(
        queryKey, 
        () => findAll(filters, orderBy, limit)
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
