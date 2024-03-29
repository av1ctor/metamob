import { ActorSubclass, Identity } from "@dfinity/agent";
import { createActor as metamobCreateActor, canisterId as metamobCanisterId } from "../../../declarations/metamob";
import { createActor as ledgerCreateActor, canisterId as ledgerCanisterId } from "../../../declarations/ledger";
import { createActor as mmtCreateActor, canisterId as mmtCanisterId } from "../../../declarations/mmt";
import { Variant } from "../../../declarations/metamob/metamob.did";
import { buildAgentJsOptions } from "./icp";

export const LEDGER_TRANSFER_FEE = BigInt(10000);

export const MAX_FILE_SIZE = 1_048_576;

export const allowedFileTypes = [
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/svg+xml"
];

export const createMainActor = (
    identity: Identity
): ActorSubclass<any> => {
    if(!metamobCanisterId) {
        throw Error('Metamob canister is undefined');
    }

    return metamobCreateActor(metamobCanisterId, {agentOptions: buildAgentJsOptions(identity)})
};

export const createLedgerActor = (
    identity: Identity
): ActorSubclass<any> => {
    if(!ledgerCanisterId) {
        throw Error('Ledger canister id is undefined');
    }

    return ledgerCreateActor(ledgerCanisterId, {agentOptions: buildAgentJsOptions(identity)})
};

export const createMmtActor = (
    identity: Identity
): ActorSubclass<any> => {
    if(!mmtCanisterId) {
        throw Error('MMT canister id is undefined');
    }
    
    return mmtCreateActor(mmtCanisterId, {agentOptions: buildAgentJsOptions(identity)})
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
            return Number.isInteger(value)? {nat32: value}: {float: value};
        case "bigint":
            return {nat64: value};
        case "boolean":
            return {bool: value};
        default:
            if(Array.isArray(value) && value.length === 2) {
                return {tuple: [valueToVariant(value[0]), valueToVariant(value[1])]};
            }
            else {
                throw Error('Unsupported type');
            }
    }    
};