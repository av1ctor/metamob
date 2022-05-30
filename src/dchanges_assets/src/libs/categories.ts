import {dchanges} from "../../../declarations/dchanges";
import {Category, Variant} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order, limit?: Limit
): Promise<Category[]> => {
    const criterias: [] | [Array<[string, string, Variant]>] = filters?
        [
            filters
                .filter(filter => filter.value !== null && filter.value !== '')
                .map(filter => [
                    filter.key, 
                    filter.op, 
                    valueToVariant(filter.value)
                ])
        ]:
        [];

    const res = await dchanges.categoryFind(
        criterias, 
        orderBy? [[orderBy.key, orderBy.dir]]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: [[0n, 20n]]);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
};

export const findById = async (
    _id?: number
): Promise<Category> => {
    if(!_id) {
        return {} as Category;
    }
    
    const res = await dchanges.categoryFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};