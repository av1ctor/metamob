import { useQuery, UseQueryResult } from "react-query";
import { Metamob, Moderation } from "../../../declarations/metamob/metamob.did";
import { EntityType, Limit, Order } from "../libs/common";
import { findByEntity } from "../libs/moderations";


export const useFindModerationsByEntity = (
    entityType: EntityType,
    entityId: number,
    orderBy: Order[], 
    limit: Limit, 
    main?: Metamob
): UseQueryResult<Moderation[], Error> => {
    return useQuery<Moderation[], Error>(
        ['moderations', entityType, entityId, ...orderBy, limit.offset, limit.size], 
        () => findByEntity(entityType, entityId, orderBy, limit, main),
        {keepPreviousData: limit.offset > 0}
    );
};