import React, {createContext, useReducer} from "react";
import { Metamob } from "../../../declarations/metamob/metamob.did";
import { createActor as metamobCreateActor, canisterId as metamobCanisterId } from "../../../declarations/metamob/index.js";
import { _SERVICE as Ledger } from "../../../declarations/ledger/ledger.did";
import { createActor as ledgerCreateActor, canisterId as ledgerCanisterId } from "../../../declarations/ledger/index.js";
import { _SERVICE as MMT } from "../../../declarations/mmt/mmt.did";
import { createActor as mmtCreateActor, canisterId as mmtCanisterId } from "../../../declarations/mmt/index.js";
import { Logger } from "../../../declarations/logger/logger.did";
import { createActor as loggerCreateActor, canisterId as loggerCanisterId } from "../../../declarations/logger/index.js";
import { config } from "../config";

export interface ActorState {
    metamob: Metamob;
    ledger: Ledger;
    mmt: MMT;
    logger: Logger;
};

export enum ActorActionType {
    SET_METAMOB,
    SET_LEDGER,
    SET_MMT,
};

export interface ActorAction {
    type: ActorActionType;
    payload: any;
};

const options = {agentOptions: {host: config.IC_GATEWAY}};

const initialState: ActorState = {
    metamob: metamobCreateActor(metamobCanisterId, options),
    ledger: ledgerCreateActor(ledgerCanisterId, options),
    mmt: mmtCreateActor(mmtCanisterId, options),
    logger: loggerCreateActor(loggerCanisterId, options),
};

export const ActorContext = createContext<[ActorState, (action: ActorAction) => void]>([
    initialState, (action: ActorAction) => {}
]);

const reducer = (state: ActorState, action: ActorAction): ActorState => {
    switch(action.type) {
        case ActorActionType.SET_METAMOB:
            return {
                ...state,
                metamob: action.payload
            };

        case ActorActionType.SET_LEDGER:
            return {
                ...state,
                ledger: action.payload
            };

        case ActorActionType.SET_MMT:
            return {
                ...state,
                mmt: action.payload
            };

        default:
            return state;
    }
};

interface Props {
    children: any
};

export const ActorContextProvider = (props: Props) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <ActorContext.Provider
            value={[state, dispatch]}>
            {props.children}
        </ActorContext.Provider>
    );
};