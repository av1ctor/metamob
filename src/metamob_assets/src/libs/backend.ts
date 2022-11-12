import { ActorSubclass, Identity } from "@dfinity/agent";
import { createActor as metamobCreateActor, canisterId as metamobCanisterId } from "../../../declarations/metamob";
import { createActor as ledgerCreateActor, canisterId as ledgerCanisterId } from "../../../declarations/ledger";
import { createActor as mmtCreateActor, canisterId as mmtCanisterId } from "../../../declarations/mmt";
import { Variant } from "../../../declarations/metamob/metamob.did";

export const LEDGER_TRANSFER_FEE = BigInt(10000);

export const createMainActor = (
    identity: Identity
): ActorSubclass<any> => {
    if(!metamobCanisterId) {
        throw Error('Metamob canister is undefined');
    }

    return metamobCreateActor(metamobCanisterId, {agentOptions: {identity}})
};

export const createLedgerActor = (
    identity: Identity
): ActorSubclass<any> => {
    if(!ledgerCanisterId) {
        throw Error('Ledger canister id is undefined');
    }

    return ledgerCreateActor(ledgerCanisterId, {agentOptions: {identity}})
};

export const createMmtActor = (
    identity: Identity
): ActorSubclass<any> => {
    if(!mmtCanisterId) {
        throw Error('MMT canister id is undefined');
    }
    
    return mmtCreateActor(mmtCanisterId, {agentOptions: {identity}})
};

export const valueToVariant = (
    value: any
): Variant => {
    if(value === undefined || value === null) {
        return {nil: null};
    }

    switch(typeof value) {
        case "string":
            return {text: value};
        case "number":
            return {nat32: value};
        case "bigint":
            return {nat64: value};
        case "boolean":
            return {bool: value};
        default:
            throw Error('Unsupported type');
    }    
};