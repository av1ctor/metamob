import {dchanges} from "../../../declarations/dchanges";
import {Region, Variant} from "../../../declarations/dchanges/dchanges.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum RegionKind {
    PLANET = 0,
    CONTINENT = 1,
    COUNTRY = 2,
    STATE = 3,
    CITY = 4,
    DISTRICT = 5,
    STREET = 6,
    BUILDING = 7,
    FLOOR = 8,
    ROOM = 9,
    OTHER = 10,
}

export const kinds: {name: string, value: any}[] = [
    {name: 'Planet', value: RegionKind.PLANET},
    {name: 'Continent', value: RegionKind.CONTINENT},
    {name: 'Country', value: RegionKind.COUNTRY},
    {name: 'State', value: RegionKind.STATE},
    {name: 'City', value: RegionKind.CITY},
    {name: 'District', value: RegionKind.DISTRICT},
    {name: 'Street', value: RegionKind.STREET},
    {name: 'Building', value: RegionKind.BUILDING},
    {name: 'Floor', value: RegionKind.FLOOR},
    {name: 'Room', value: RegionKind.ROOM},
    {name: 'Other', value: RegionKind.OTHER},
];

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order, 
    limit?: Limit
) => {
    const criterias: [] | [Array<[string, string, Variant]>]  = filters?
        [filters.map(filter => [filter.key, filter.op, valueToVariant(filter.value)])]:
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
    _id: number
): Promise<Region> => {
    const res = await dchanges.regionFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findTreeById = async (
    _id: number
): Promise<Region[]> => {
    const res = await dchanges.regionFindTreeById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

const kindToText = (kind: RegionKind): string => {
    return kinds.find(k => k.value === kind)?.name || 'Other';
};

export const search = async (
    value: string
): Promise<{name: string, value: number}[]> => {
    const regions = await findAll([
        {
            key: 'name',
            op: 'contains',
            value: value
        }
    ]);

    return regions.map(r => ({
        name: `${r.name} (${kindToText(r.kind)})`,
        value: r._id
    }));
};
