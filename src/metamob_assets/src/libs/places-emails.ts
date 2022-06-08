import {Metamob, PlaceEmail} from "../../../declarations/metamob/metamob.did";
import {Limit, Order} from "./common";

export const findAll = async (
    placeId: number,
    orderBy?: Order[], 
    limit?: Limit,
    main?: Metamob
): Promise<PlaceEmail[]> => {
    if(!main) {
        return [];
     }
 
    const res = await main?.placeEmailFindByPlace(
        placeId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: [[0n, 20n]]);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};
