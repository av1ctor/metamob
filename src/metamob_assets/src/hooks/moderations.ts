import { useQuery, UseQueryResult } from "react-query";
import { Metamob, ModerationResponse } from "../../../declarations/metamob/metamob.did";
import { EntityType, Limit, Order } from "../libs/common";
import { findByEntity } from "../libs/moderations";
import { useActors } from "./actors";


export const useFindModerationsByEntity = (
    entityType: EntityType,
    entityId: number,
    orderBy: Order[], 
    limit: Limit
): UseQueryResult<ModerationResponse[], Error> => {
    const {metamob} = useActors();
    
    return useQuery<ModerationResponse[], Error>(
        ['moderations', entityType, entityId, ...orderBy, limit.offset, limit.size], 
        () => findByEntity(entityType, entityId, orderBy, limit, metamob),
        {keepPreviousData: limit.offset > 0}
    );
};
