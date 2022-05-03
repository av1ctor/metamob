import React, {createContext, useReducer} from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Profile } from "../../../declarations/dchanges/dchanges.did";

export interface AuthState {
    client?: AuthClient;
    principal: string;
    user?: Profile;
};

export enum AuthActionType {
    SET_CLIENT,
    SET_PRINCIPAL,
    SET_USER
};

interface Action {
    type: AuthActionType;
    payload: any;
}

const initialState: AuthState = {
    client: undefined,
    principal: "",
    user: undefined,
};

export const AuthContext = createContext<[AuthState, (action: Action) => void]>(
    [initialState, (action: Action) => {}]);

const reducer = (state: AuthState, action: Action) => {
    switch(action.type) {
        case AuthActionType.SET_CLIENT:
            return {
                ...state,
                client: action.payload
            };
        
        case AuthActionType.SET_PRINCIPAL:
            return {
                ...state,
                principal: action.payload
            };

        case AuthActionType.SET_USER:
            return {
                ...state,
                user: action.payload
            };

        default:
            return state;
    }
};

interface Props {
    children: any
};

export const AuthContextProvider = (props: Props) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    
    return (
        <AuthContext.Provider
            value={[state, dispatch]}>
            {props.children}
        </AuthContext.Provider>
    );
};


