import { Principal } from "@dfinity/principal";
import { Result } from "./result";

export enum ICProviderType {
    InternetIdentity,
    Plug,
};

export enum ICProviderState {
    Idle,
    Initializing,
    Initialized,
    Connecting,
    Connected,
    Configuring,
    Configured,
    Disconnected,
};

export interface ICProvider {
    initialize: () => Promise<boolean>;
    connect: (options?: any) => Promise<Result<any, string>>;
    isAuthenticated: () => Promise<boolean>;
    createActor: (id?: string) => Promise<any>;
    getPrincipal: () => Principal | undefined;
    login: (onSuccess?: () => void, onError?: (msg: string|undefined) => void) => Promise<void>;
    logout: () => Promise<void>;
};
