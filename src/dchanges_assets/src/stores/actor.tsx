import React, {createContext, useReducer} from "react";
import { DChanges } from "../../../declarations/dchanges/dchanges.did";

export interface ActorState {
    main?: DChanges;
};

export enum ActorActionType {
    SET_MAIN
};

interface Action {
    type: ActorActionType;
    payload: any;
};

const initialState: ActorState = {
    main: undefined
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