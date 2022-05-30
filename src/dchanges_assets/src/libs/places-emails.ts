import {DChanges, PlaceEmail} from "../../../declarations/dchanges/dchanges.did";
import {Limit, Order} from "./common";

export const findAll = async (
    placeId: number,
    orderBy?: Order, 
    limit?: Limit,
    main?: DChanges
): Promise<PlaceEmail[]> => {
    if(!main) {
        return [];
     }
 
    const res = await main?.placeEmailFindByPlace(
        placeId, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: [[0n, 20n]]);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};
