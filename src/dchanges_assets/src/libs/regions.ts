import {dchanges} from "../../../declarations/dchanges";
import {Region, Variant} from "../../../declarations/dchanges/dchanges.did";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter, 
    orderBy?: Order, 
    limit?: Limit
) => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters && filters.value?
        [[[filters.key, filters.op, {text: filters.value}]]]:
        [];

    const res = await dchanges.regionFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: [[0n, 20n]]);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};

export const findById = async (
    pubId: string
): Promise<Region> => {
    const res = await dchanges.regionFindById(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

