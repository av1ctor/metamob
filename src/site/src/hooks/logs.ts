import { useQuery, UseQueryResult } from "react-query";
import { Msg } from "../../../declarations/logger/logger.did";
import { findAll } from "../libs/logs";
import { useActors } from "./actors";

export const useFindLogs = (
    offset: number,
    size: number
): UseQueryResult<Msg[], Error> => {
    const {logger} = useActors();

    return useQuery<Msg[], Error>(
        ['logs', offset, size],
        () => findAll(offset, size, logger),
        {keepPreviousData: offset > 0}
    );
};
