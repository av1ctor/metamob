import { useContext, useEffect } from "react";
import { canisterId as metamobCanisterId } from "../../../declarations/metamob";
import { canisterId as ledgerCanisterId } from "../../../declarations/ledger";
import { canisterId as mmtCanisterId } from "../../../declarations/mmt";
import { ICProvider, ICProviderState, ICProviderType } from "../interfaces/icprovider";
import { ActorActionType, ActorContext } from "../stores/actor";
import { Metamob, ProfileResponse } from "../../../declarations/metamob/metamob.did";
import { AuthActionType, AuthContext } from "../stores/auth";
import { Principal } from "@dfinity/principal";
import { accountIdentifierFromBytes, principalToAccountDefaultIdentifier } from "../libs/icp";
import { Result } from "../interfaces/result";
import { IcProviderBuider } from "../libs/icproviderbuilder";

interface AuthResponse {
    isAuthenticated: boolean;
    isLogged: boolean;
    user?: ProfileResponse;
    principal?: Principal;
    accountId?: string,
    login: (providerType: ICProviderType) => Promise<Result<any, string>>;
    logout: () => Promise<void>;
    update: (profile: ProfileResponse) => void;
}

const locks = {
    initialize: false,
    connect: false,
    configure: false,
};

export const useAuth = (
): AuthResponse => {
    const [auth, authDisp] = useContext(AuthContext);
    const [, actorsDisp] = useContext(ActorContext);

    const _initialize = async (
        provider: ICProvider
    ) => {
        if(locks.initialize) {
            return;
        }

        locks.initialize = true;

        try {
            authDisp({
                type: AuthActionType.SET_STATE,
                payload: ICProviderState.Initializing
            });

            if(!await provider.initialize()) {
                authDisp({
                    type: AuthActionType.SET_STATE,
                    payload: ICProviderState.Disconnected
                });
                return;
            }

            authDisp({
                type: AuthActionType.SET_STATE,
                payload: ICProviderState.Initialized
            });
        }
        finally {
            locks.initialize = false;
        }
    };

    const _connect = async (
        provider: ICProvider
    ) => {
        if(locks.connect) {
            return;
        }

        locks.connect = true;

        try {
            authDisp({
                type: AuthActionType.SET_STATE,
                payload: ICProviderState.Connecting
            });

            const res = await provider.connect();
            if(res.err) {
                authDisp({
                    type: AuthActionType.SET_STATE,
                    payload: ICProviderState.Disconnected
                });
                return;
            }

            authDisp({
                type: AuthActionType.SET_STATE,
                payload: ICProviderState.Connected
            });
        }
        finally {
            locks.connect = false;
        }
    };

    const _createActors = async (
        provider: ICProvider
    ): Promise<Metamob> => {
        const actors = await Promise.all([
            provider.createActor(metamobCanisterId),
            provider.createActor(ledgerCanisterId),
            provider.createActor(mmtCanisterId),
        ]);
        actorsDisp({
            type: ActorActionType.SET_METAMOB,
            payload: actors[0]
        });

        actorsDisp({
            type: ActorActionType.SET_LEDGER,
            payload: actors[1]
        });

        actorsDisp({
            type: ActorActionType.SET_MMT,
            payload: actors[2]
        });

        return actors[0];
    };

    const _loadUser = async (
        provider: ICProvider,
        metamob?: Metamob
    ) => {
        if(!await provider.isAuthenticated()) {
            authDisp({
                type: AuthActionType.SET_PRINCIPAL,
                payload: undefined
            });
            authDisp({
                type: AuthActionType.SET_ACCOUNT_ID,
                payload: undefined
            });
            authDisp({
                type: AuthActionType.SET_USER,
                payload: undefined
            });

            return;
        }

        const principal = provider.getPrincipal();
        authDisp({
            type: AuthActionType.SET_PRINCIPAL,
            payload: principal
        });

        authDisp({
            type: AuthActionType.SET_ACCOUNT_ID,
            payload: principal?
                accountIdentifierFromBytes(
                    principalToAccountDefaultIdentifier(principal)):
                undefined
        });

        authDisp({
            type: AuthActionType.SET_USER,
            payload: metamob? 
                await _loadAuthenticatedUser(metamob): 
                undefined
        });

    };

    const _configure = async (
        provider: ICProvider
    ) => {
        if(locks.configure) {
            return;
        }

        locks.configure = true;

        try {
            authDisp({
                type: AuthActionType.SET_STATE,
                payload: ICProviderState.Configuring
            });

            const metamob = await _createActors(provider);
            await _loadUser(provider, metamob);

            authDisp({
                type: AuthActionType.SET_STATE,
                payload: ICProviderState.Configured
            });
        }
        finally {
            locks.configure = false;
        }
    };

    const login = async (
        providerType: ICProviderType
    ): Promise<Result<any, string>> => {
        
        //
        let provider: ICProvider | undefined = new IcProviderBuider().build(providerType);
        if(!provider) {
            return {err: "Unknown provider"};
        }

        // wait provider to initialize
        authDisp({
            type: AuthActionType.SET_STATE,
            payload: ICProviderState.Initializing
        });

        if(!await provider.initialize()) {
            authDisp({
                type: AuthActionType.SET_STATE,
                payload: ICProviderState.Disconnected
            });

            return {err: "IC Provider initialization failed"};
        }

        // do the logon
        const res = await provider?.login();
        if(res.err) {
            return res;
        }

        window.localStorage.setItem('providerType', ICProviderType[providerType]);

        authDisp({
            type: AuthActionType.SET_PROVIDER,
            payload: provider
        });
        authDisp({
            type: AuthActionType.SET_STATE,
            payload: ICProviderState.Initialized
        });

        return {ok: null};
    };

    const logout = async () => {
        await auth.provider?.logout();
        authDisp({
            type: AuthActionType.SET_PRINCIPAL,
            payload: undefined
        });
        authDisp({
            type: AuthActionType.SET_ACCOUNT_ID,
            payload: undefined
        });
        authDisp({
            type: AuthActionType.SET_USER,
            payload: undefined
        });
    };

    const update = (
        profile: ProfileResponse
    ) => {
        authDisp({
            type: AuthActionType.SET_USER,
            payload: profile
        });
    };

    useEffect(() => {
        if(!auth.provider) {
            return;
        }

        switch(auth.state) {
            case ICProviderState.Idle:
                _initialize(auth.provider);
                return;

            case ICProviderState.Initialized:
                _connect(auth.provider);
                return;

            case ICProviderState.Connected:
                _configure(auth.provider);
                return;
        }
        
    }, [auth.provider, auth.state]);

    return {
        isAuthenticated: auth.principal !== undefined,
        isLogged: auth.user !== undefined,
        user: auth.user,
        principal: auth.principal,
        accountId: auth.accountId,
        login,
        logout,
        update,
    }
};

const _loadAuthenticatedUser = async (
    metamob: Metamob
): Promise<ProfileResponse|undefined> => {
    try {
        const res = await metamob.userFindMe();
        if('ok' in res) {
            return res.ok;
        }
    }
    catch(e) {
    }

    return undefined;
};
