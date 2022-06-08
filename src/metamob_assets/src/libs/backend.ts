import { Actor, ActorSubclass, HttpAgent, Identity } from "@dfinity/agent";
import { idlFactory, canisterId } from "../../../declarations/metamob";
import { Metamob, Variant } from "../../../declarations/metamob/metamob.did";
import { idlFactory as Ledger } from "../../../declarations/ledger";
import { config } from "../config";

export const LEDGER_TRANSFER_FEE = BigInt(10000);

export const createAgent = (
    identity: Identity
): HttpAgent => {
    const host = config.IC_URL;
    const agent = new HttpAgent({identity, host});
    return agent;
};

export const createActor = <T> (
    interfaceFactory: (IDL: any) => any,
    id: string,
    agent: HttpAgent
): ActorSubclass<T> => {
    
    //FIXME: only to be used in development mode!!!
    if(process.env.NODE_ENV === 'development') {
        agent.fetchRootKey();
    }
    
    const actor = Actor.createActor<T>(interfaceFactory, {
        agent: agent,
        canisterId: id,
    });    

    return actor;
};

export const createMainActor = (
    identity: Identity
): ActorSubclass<Metamob> => {
    if(!canisterId) {
        throw Error('canisterId is undefined');
    }

    const agent = createAgent(identity);
    return createActor<Metamob>(idlFactory, canisterId, agent);
};

export const createLedgerActor = (
    identity: Identity
): ActorSubclass<Ledger> => {
    if(!config.LEDGER_CANISTER_ID) {
        throw Error('Ledger canister id is undefined');
    }

    const agent = createAgent(identity);
    return createActor<Ledger>(Ledger, config.LEDGER_CANISTER_ID, agent);
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