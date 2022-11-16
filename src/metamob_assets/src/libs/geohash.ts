
import {encode as base32Encode} from "./base32";

export const encode = (
    lat: number,
    lng: number
): string => {
    return encodeEx(lat, lng, 12);
};

export const encodeEx = (
    lat: number,
    lng: number,
    chars: number
): string => {
    let bits = chars * 5;
    let hash = encodeIntEx(lat, lng, bits);
    let enc = base32Encode(hash);
    return enc.substring(12 - chars);
};

export const encodeInt = (
    lat: number, 
    lng: number
): bigint => {
    let latInt = _encodeRange(lat, 90);
    let lngInt = _encodeRange(lng, 180);
    return _interleave(latInt, lngInt)
};

export const encodeIntEx = (
    lat: number, 
    lng: number, 
    bits: number
): bigint => {
    let hash = encodeInt(lat, lng);
    return hash >> (64n - BigInt(bits));
};

const _encodeRange = (
    x: number, 
    r: number
): number => {
    let p = (x + r) / (2 * r);
    return Math.floor(p * 4_294_967_296)|0;
};

const _spread = (
    x: number
): bigint => {
    let X = BigInt(x);
    X = (X | (X << 16n)) & 0x0000ffff0000ffffn;
    X = (X | (X << 8n)) & 0x00ff00ff00ff00ffn;
    X = (X | (X << 4n)) & 0x0f0f0f0f0f0f0f0fn;
    X = (X | (X << 2n)) & 0x3333333333333333n;
    X = (X | (X << 1n)) & 0x5555555555555555n;
    return X;
};

const _interleave = (
    x: number, 
    y: number
): bigint => {
    return _spread(x) | (_spread(y) << 1n);
};