import React, {createContext, useReducer} from "react";
import { Metamob } from "../../../declarations/metamob/metamob.did";
import { idlFactory as Ledger } from "../../../declarations/ledger";
import { _SERVICE as MMT } from "../../../declarations/mmt/mmt.did";

export interface ActorState {
    main?: Metamob;
    ledger?: Ledger;
    mmt?: MMT;
};

export enum ActorActionType {
    SET_MAIN,
    SET_LEDGER,
    SET_MMT,
};

interface Action {
    type: ActorActionType;
    payload: any;
};

const initialState: ActorState = {
    main: undefined,
    ledger: undefined,
    mmt: undefined,
};

export const ActorContext = createContext<[ActorState, (action: Action) => void]>([
    initialState, (action: Action) => {}
]);

const reducer = (state: ActorState, action: Action): ActorState => {
    switch(action.type) {
        case ActorActionType.SET_MAIN:
            return {
                ...state,
                main: action.payload
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