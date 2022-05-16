import { Actor, ActorSubclass, HttpAgent, Identity } from "@dfinity/agent";
import { idlFactory, canisterId } from "../../../declarations/dchanges";
import { DChanges, Variant } from "../../../declarations/dchanges/dchanges.did";

export const createMainActor = (
    identity: Identity
): ActorSubclass<DChanges> => {
    if(!canisterId) {
        throw Error('caninsterId is null');
    }
    
    const agent = new HttpAgent({identity});
    //FIXME: only to be used in development mode!!!
    if(process.env.NODE_ENV === 'development') {
        agent.fetchRootKey();
    }
    
    const actor = Actor.createActor<DChanges>(idlFactory, {
        agent: agent,
        canisterId: canisterId,
    });    

    return actor;
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