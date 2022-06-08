import React, {createContext, useReducer} from "react";
import { AuthClient } from "@dfinity/auth-client";
import { ProfileResponse } from "../../../declarations/metamob/metamob.did";
import { Identity } from "@dfinity/agent";

export interface AuthState {
    client?: AuthClient;
    identity?: Identity;
    user?: ProfileResponse;
};

export enum AuthActionType {
    SET_CLIENT,
    SET_IDENTITY,
    SET_USER,
    LOGOUT
};

interface Action {
    type: AuthActionType;
    payload: any;
}

const initialState: AuthState = {
    client: undefined,
    identity: undefined,
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
        
        case AuthActionType.SET_IDENTITY:
            return {
                ...state,
                identity: action.payload
            };

        case AuthActionType.SET_USER:
            return {
                ...state,
                user: action.payload
            };

        case AuthActionType.LOGOUT:
            return {
                ...state,
                identity: undefined,
                user: undefined
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


