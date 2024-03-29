import {Metamob, Place, PlaceAuth, Variant} from "../../../declarations/metamob/metamob.did";
import { valueToVariant } from "./backend";
import {Filter, Limit, Order} from "./common";

export enum PlaceKind {
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
    DAO = 10,
    OTHER = 99,
}

export enum PlaceAuthNum {
    NONE = 0,
    EMAIL = 1,
    DIP20 = 2,
    DIP721 = 3,
}

export const kinds: {name: string, value: any}[] = [
    {name: 'Planet', value: PlaceKind.PLANET},
    {name: 'Continent', value: PlaceKind.CONTINENT},
    {name: 'Country', value: PlaceKind.COUNTRY},
    {name: 'State', value: PlaceKind.STATE},
    {name: 'City', value: PlaceKind.CITY},
    {name: 'District', value: PlaceKind.DISTRICT},
    {name: 'Street', value: PlaceKind.STREET},
    {name: 'Building', value: PlaceKind.BUILDING},
    {name: 'Floor', value: PlaceKind.FLOOR},
    {name: 'Room', value: PlaceKind.ROOM},
    {name: 'DAO', value: PlaceKind.DAO},
    {name: 'Other', value: PlaceKind.OTHER},
];

export const auths: {name: string, value: any}[] = [
    {name: 'None', value: PlaceAuthNum.NONE},
    {name: 'e-mail', value: PlaceAuthNum.EMAIL},
    {name: 'DIP20 (Token)', value: PlaceAuthNum.DIP20},
    {name: 'DIP721 (NFT)', value: PlaceAuthNum.DIP721},
];

export const authToEnum = (
    auth: PlaceAuth
): PlaceAuthNum => {
    if('none' in auth) {
        return PlaceAuthNum.NONE;
    }
    else if('email' in auth) {
        return PlaceAuthNum.EMAIL;
    }
    else if('dip20' in auth) {
        return PlaceAuthNum.DIP20;
    }
    else /*if('dip721' in auth)*/ {
        return PlaceAuthNum.DIP721;
    }
};

export const kindToText = (
    kind: PlaceKind
): string => {
    return kinds.find(k => k.value === kind)?.name || 'Other';
};

export const findAll = async (
    filters?: Filter[], 
    orderBy?: Order[], 
    limit?: Limit,
    metamob?: Metamob
): Promise<Place[]> => {
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
    const res = await metamob?.placeFind(
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
): Promise<Place> => {
    if(!metamob || !_id) {
       return {} as Place;
    }
    
    const res = await metamob.placeFindById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findTreeById = async (
    _id?: number,
    metamob?: Metamob
): Promise<Place[]> => {
    if(!metamob || !_id) {
        return [];
    }
    
    const res = await metamob.placeFindTreeById(_id);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByPubId = async (
    pubId?: string,
    metamob?: Metamob
): Promise<Place> => {
    if(!metamob || !pubId) {
        return {} as Place;
    }
    
    const res = await metamob.placeFindByPubId(pubId);
    if('err' in res) {
        throw new Error(res.err);
    }
    return res.ok; 
};

export const findByUser = async (
    userId?: number, 
    orderBy?: Order[], 
    limit?: Limit,
    main?: Metamob
): Promise<Place[]> => {
    if(!main || !userId) {
        return [];
    }   

    const res = await main.placeFindByUser(
        userId, 
        orderBy? [orderBy.map(o => [o.key, o.dir])]: [], 
        limit? [[BigInt(limit.offset), BigInt(limit.size)]]: []);
    
    if('err' in res) {
        throw new Error(res.err);
    }

    return res.ok; 
}

export const search = async (
    value: string,
    metamob?: Metamob
): Promise<{name: string, value: number}[]> => {
    const places = await findAll(
        [{
            key: 'name',
            op: 'contains',
            value: value
        }],
        undefined,
        undefined,        
        metamob
    );

    return places.map(r => ({
        name: `${r.name} (${kindToText(r.kind)})`,
        value: r._id
    }));
};
