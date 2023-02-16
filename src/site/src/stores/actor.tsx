import React, {createContext, useReducer} from "react";
import { Metamob } from "../../../declarations/metamob/metamob.did";
import { _SERVICE as Ledger } from "../../../declarations/ledger/ledger.did";
import { _SERVICE as MMT } from "../../../declarations/mmt/mmt.did";

export interface ActorState {
    metamob?: Metamob;
    ledger?: Ledger;
    mmt?: MMT;
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

const initialState: ActorState = {
    metamob: undefined,
    ledger: undefined,
    mmt: undefined,
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