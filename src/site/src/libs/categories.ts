import {Category, Metamob, Variant} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
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

    const res = await metamob?.categoryFind(
        criterias, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: [[0n, 20n]]);
    
    if(!res || 'err' in res) {
        throw new Error(res?.err);
    }

    return res.ok; 
};

export const findById = async (
    _id?: number,
    metamob?: Metamob
): Promise<Category> => {
    if(!metamob || !_id) {
        return {} as Category;
    }
    
    const res = await metamob.categoryFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};