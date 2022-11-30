import { useQuery, UseQueryResult } from "react-query";
import { Msg } from "../../../declarations/logger/logger.did";
import { findAll } from "../libs/logs";

export const useFindLogs = (
    offset: number,
    size: number
): UseQueryResult<Msg[], Error> => {
    return useQuery<Msg[], Error>(
        ['logs', offset, size],
        () => findAll(offset, size),
        {keepPreviousData: offset > 0}
    );
};
