import { Variant } from "../../../declarations/metamob/metamob.did";

export enum VariantType {
    ARRAY,
    BOOL,
    FLOAT,
    INT,
    INT8,
    INT16,
    INT32,
    INT64,
    NAT,
    NAT8,
    NAT16,
    NAT32,
    NAT64,
    NIL,
    TEXT,
    TUPLE,
};

export const variantOptions = [
    {name: 'Array', value: VariantType.ARRAY},
    {name: 'Bool', value: VariantType.BOOL},
    {name: 'Float', value: VariantType.FLOAT},
    {name: 'Int', value: VariantType.INT},
    {name: 'Int8', value: VariantType.INT8},
    {name: 'Int16', value: VariantType.INT16},
    {name: 'Int32', value: VariantType.INT32},
    {name: 'Int64', value: VariantType.INT64},
    {name: 'Nat', value: VariantType.NAT},
    {name: 'Nat8', value: VariantType.NAT8},
    {name: 'Nat16', value: VariantType.NAT16},
    {name: 'Nat32', value: VariantType.NAT32},
    {name: 'Nat64', value: VariantType.NAT64},
    {name: 'Null', value: VariantType.NIL},
    {name: 'Text', value: VariantType.TEXT},
    {name: 'Tuple', value: VariantType.TUPLE},
];

export const getVariantType = (
    value: Variant
): VariantType => {
    if('array' in value) {
        return VariantType.ARRAY;
    }
    else if('bool' in value) {
        return VariantType.BOOL;
    }
    else if('float' in value) {
        return VariantType.FLOAT;
    }
    else if('int' in value) {
        return VariantType.INT;
    }
    else if('int8' in value) {
        return VariantType.INT8;
    }
    else if('int16' in value) {
        return VariantType.INT16;
    }
    else if('int32' in value) {
        return VariantType.INT32;
    }
    else if('int64' in value) {
        return VariantType.INT64;
    }
    else if('nat' in value) {
        return VariantType.NAT;
    }
    else if('nat8' in value) {
        return VariantType.NAT8;
    }
    else if('nat16' in value) {
        return VariantType.NAT16;
    }
    else if('nat32' in value) {
        return VariantType.NAT32;
    }
    else if('nat64' in value) {
        return VariantType.NAT64;
    }
    else if('nil' in value) {
        return VariantType.NIL;
    }
    else if('text' in value) {
        return VariantType.TEXT;
    }
    else if('tuple' in value) {
        return VariantType.TUPLE;
    }

    throw new Error('Unknown variant type');
};

export const variantToString = (
    value: Variant
): string => {
    if('array' in value) {
        return value.array.map(i => variantToString(i)).join(',');
    }
    else if('bool' in value) {
        return value.bool.toString();
    }
    else if('float' in value) {
        return value.float.toString();
    }
    else if('int' in value) {
        return value.int.toString();
    }
    else if('int8' in value) {
        return value.int8.toString();
    }
    else if('int16' in value) {
        return value.int16.toString();
    }
    else if('int32' in value) {
        return value.int32.toString();
    }
    else if('int64' in value) {
        return value.int64.toString();
    }
    else if('nat' in value) {
        return value.nat.toString();
    }
    else if('nat8' in value) {
        return value.nat8.toString();
    }
    else if('nat16' in value) {
        return value.nat16.toString();
    }
    else if('nat32' in value) {
        return value.nat32.toString();
    }
    else if('nat64' in value) {
        return value.nat64.toString();
    }
    else if('nil' in value) {
        return "null";
    }
    else if('text' in value) {
        return value.text;
    }
    else if('tuple' in value) {
        return [variantToString(value.tuple[0]), variantToString(value.tuple[1])].join(',');
    }

    throw new Error('Unknown variant type');
};

export const stringToVariant = (
    value: string,
    type: VariantType
): Variant => {
    switch(type) {
        case VariantType.ARRAY:
            const arr = value.split(',')
            return {array: arr.map(i => ({text: i}))};
        case VariantType.BOOL:
            return {bool: value.toLowerCase() === 'true'? true: false};
        case VariantType.FLOAT:
            return {float: Number.parseFloat(value)};
        case VariantType.INT:
            return {int: BigInt(value)};
        case VariantType.INT8:
            return {int8: Number.parseInt(value)};
        case VariantType.INT16:
            return {int16: Number.parseInt(value)};
        case VariantType.INT32:
            return {int32: Number.parseInt(value)};
        case VariantType.INT64:
            return {int64: BigInt(value)};
        case VariantType.NAT:
            return {nat: BigInt(value)};
        case VariantType.NAT8:
            return {nat8: Number.parseInt(value)};
        case VariantType.NAT16:
            return {nat16: Number.parseInt(value)};
        case VariantType.NAT32:
            return {nat32: Number.parseInt(value)};
        case VariantType.NAT64:
            return {nat64: BigInt(value)};
        case VariantType.NIL:
            return {nil: null};
        case VariantType.TEXT:
            return {text: value};
        case VariantType.TUPLE:
            const tokens = value.split(',')
            if(tokens.length !== 2) {
                throw new Error('Invalid tuple');
            }
            return {tuple: [{text: tokens[0]}, {text: tokens[1]}]};
    }
};
