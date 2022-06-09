import { sha224 } from "js-sha256";
import { Buffer } from "buffer";
import crc from "crc";
import { Principal } from "@dfinity/principal";
import { TransferError } from "../../../declarations/ledger/ledger.did";

export const toHexString = (
    byteArray: Uint8Array
): string => {
    return Array.from(byteArray, (byte) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('').toUpperCase();
};

export const hexToBytes = (
    hex: string
): Uint8Array => {
    const bytes = new Uint8Array(hex.length >> 1);
    for (let i = 0; i < hex.length >> 1; ++i) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
};

export const uint8ArrayToBigInt = (
    array: Uint8Array
): bigint => {
    const view = new DataView(array.buffer, array.byteOffset, array.byteLength);
    if (typeof view.getBigUint64 === "function") {
        return view.getBigUint64(0);
    } else {
        const high = BigInt(view.getUint32(0));
        const low = BigInt(view.getUint32(4));

        return (high << BigInt(32)) + low;
    }
};

const TWO_TO_THE_32 = BigInt(1) << BigInt(32);
export const bigIntToUint8Array = (
    value: bigint
): Uint8Array => {
    const array = new Uint8Array(8);
    const view = new DataView(array.buffer, array.byteOffset, array.byteLength);
    if (typeof view.setBigUint64 === "function") {
        view.setBigUint64(0, value);
    } else {
        view.setUint32(0, Number(value >> BigInt(32)));
        view.setUint32(4, Number(value % TWO_TO_THE_32));
    }

    return array;
};

export const arrayBufferToArrayOfNumber = (
    buffer: ArrayBuffer
): number[] => {
    const typedArray = new Uint8Array(buffer);
    return Array.from(typedArray);
};

export const arrayOfNumberToUint8Array = (
    numbers: number[]
): Uint8Array => {
    return new Uint8Array(numbers);
};

export const arrayOfNumberToArrayBuffer = (
    numbers: number[]
): ArrayBuffer => {
  return arrayOfNumberToUint8Array(numbers).buffer;
};

export const arrayBufferToNumber = (
    buffer: ArrayBuffer
): number => {
  const view = new DataView(buffer);
  return view.getUint32(view.byteLength - 4);
};

export const numberToArrayBuffer = (
    value: number,
    byteLength: number
): ArrayBuffer => {
    const buffer = new ArrayBuffer(byteLength);
    new DataView(buffer).setUint32(byteLength - 4, value);
    return buffer;
};

export const asciiStringToByteArray = (
    text: string
): number[] => {
    return Array.from(text).map((c) => c.charCodeAt(0));
};

export const toSubAccountId = (
    subAccount: number[]
): number => {
    const bytes = arrayOfNumberToArrayBuffer(subAccount);
    return arrayBufferToNumber(bytes);
};

export const accountIdentifierToBytes = (
    accountIdentifier: string
): Uint8Array => {
  return Uint8Array.from(Buffer.from(accountIdentifier, "hex")).subarray(4);
};

export const accountIdentifierFromBytes = (
    accountIdentifier: Uint8Array
): string => {
    return Buffer.from(accountIdentifier).toString("hex");
};

export const principalToAccountDefaultIdentifier = (
    principal: Principal,
): Uint8Array => {
    // Hash (sha224) the principal, the subAccount and some padding
    const padding = asciiStringToByteArray("\x0Aaccount-id");

    const shaObj = sha224.create();
    shaObj.update([
        ...padding,
        ...principal.toUint8Array(),
        ...(Array(32).fill(0)),
    ]);
    const hash = new Uint8Array(shaObj.array());

    // Prepend the checksum of the hash and convert to a hex string
    const checksum = calculateCrc32(hash);
    const bytes = new Uint8Array([...checksum, ...hash]);
    return bytes;
};

export const principalToSubAccount = (
    principal: Principal
) => {
    const bytes = principal.toUint8Array();
    const subAccount = new Uint8Array(32);
    subAccount[0] = bytes.length;
    subAccount.set(bytes, 1);
    return subAccount;
};

// 4 bytes
export const calculateCrc32 = (
    bytes: Uint8Array
) => {
    const checksumArrayBuf = new ArrayBuffer(4);
    const view = new DataView(checksumArrayBuf);
    view.setUint32(0, crc.crc32(Buffer.from(bytes)), false);
    return Buffer.from(checksumArrayBuf);
};

const removeZerosAtRight = (s: string): string => {
    let i = s.length - 1;
    for(; i > 0; i--) {
        if(s.charCodeAt(i) !== 48) {
            break;
        }
    }
    return s.substring(0, i+1);
};

export const icpToDecimal = (
    icp: bigint
): string => {
    const int = Number(icp / BigInt(1e8));
    const dec = ('0000000' + Math.abs(Number(icp % BigInt(1e8))).toString()).substr(-8);
    return `${int}.${removeZerosAtRight(dec)}`; 
}

export const decimalToIcp = (
    value: string
): bigint => {
    const dot = value.indexOf('.');
    const int = dot > -1? 
        BigInt(value.substring(0, dot) || '0'):
        BigInt(value);
    const dec = dot > -1? 
        Number(value.substring(dot)):
        Number(0);
    return int * BigInt(1e8) + BigInt(Math.ceil(dec * 1e8)|0); 
}

export const transferErrorToText = (
    err: TransferError
): string => {

    if('TxTooOld' in err) {
        return 'Transaction too old';
    }
    else if('BadFee' in err) {
        return `Bad fee: expected ${err.BadFee.expected_fee.e8s.toString()}`;
    }
    else if('TxDuplicate' in err) {
        return `Transaction duplicated at block ${err.TxDuplicate.duplicate_of}`;
    }
    else if('TxCreatedInFuture' in err) {
        return 'Bad date';
    }
    else if('InsufficientFunds' in err) {
        return `Insufficient funds: ${err.InsufficientFunds.balance.e8s.toString()}`
    }

    return 'Unknown';
};
