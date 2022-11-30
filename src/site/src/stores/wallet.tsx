import React, {createContext, useReducer} from "react";
import { ICProvider } from "../interfaces/icprovider";

export interface UserBalances {
    icp: bigint;
    mmt: bigint;
    staked: bigint;
    deposited: bigint;
}

export interface WalletState {
    balances: UserBalances;
};

export enum WalletActionType {
    SET_BALANCES,
};

export interface WalletAction {
    type: WalletActionType;
    payload: any;
}

const initialState: WalletState = {
    balances: {
        icp: 0n,
        mmt: 0n,
        staked: 0n,
        deposited: 0n,
    },
};

export const WalletContext = createContext<[WalletState, (action: WalletAction) => void]>(
    [initialState, (action: WalletAction) => {}]);

const reducer = (state: WalletState, action: WalletAction): WalletState => {
    switch(action.type) {
        case WalletActionType.SET_BALANCES:
            return {
                ...state,
                balances: action.payload
            };

        default:
            return state;
    }
};

interface Props {
    provider: ICProvider | undefined;
    children: any
};

export const WalletContextProvider = (props: Props) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    return (
        <WalletContext.Provider
            value={[state, dispatch]}>
            {props.children}
        </WalletContext.Provider>
    );
};


