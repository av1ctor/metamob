import { Principal } from "@dfinity/principal";
import React, {createContext, useReducer} from "react";
import { ProfileResponse } from "../../../declarations/metamob/metamob.did";
import { ICProvider, ICProviderState } from "../interfaces/icprovider";

export interface AuthState {
    state: ICProviderState;
    provider?: ICProvider;
    user?: ProfileResponse;
    principal?: Principal;
    accountId?: string;
};

export enum AuthActionType {
    SET_STATE,
    SET_PROVIDER,
    SET_USER,
    SET_PRINCIPAL,
    SET_ACCOUNT_ID,
};

export interface AuthAction {
    type: AuthActionType;
    payload: any;
}

const initialState: AuthState = {
    state: ICProviderState.Idle,
    provider: undefined,
    user: undefined,
    principal: undefined,
    accountId: undefined,
};

export const AuthContext = createContext<[AuthState, (action: AuthAction) => void]>(
    [initialState, (action: AuthAction) => {}]);

const reducer = (state: AuthState, action: AuthAction): AuthState => {
    switch(action.type) {
        case AuthActionType.SET_STATE:
            return {
                ...state,
                state: action.payload
            };

        case AuthActionType.SET_PROVIDER:
            return {
                ...state,
                provider: action.payload
            };
        
        case AuthActionType.SET_USER:
            return {
                ...state,
                user: action.payload
            };

        case AuthActionType.SET_PRINCIPAL:
            return {
                ...state,
                principal: action.payload
            };

        case AuthActionType.SET_ACCOUNT_ID:
            return {
                ...state,
                accountId: action.payload
            };

        default:
            return state;
    }
};

interface Props {
    provider: ICProvider | undefined;
    children: any
};

export const AuthContextProvider = (props: Props) => {
    const [state, dispatch] = useReducer(
        reducer, {
            ...initialState, 
            provider: props.provider,
    });

    return (
        <AuthContext.Provider
            value={[state, dispatch]}>
            {props.children}
        </AuthContext.Provider>
    );
};


