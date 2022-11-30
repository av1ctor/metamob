import { Principal } from "@dfinity/principal";
import { Result } from "./result";

export enum ICProviderType {
    InternetIdentity,
    Plug,
    Stoic,
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
    login: () => Promise<Result<any, string>>;
    logout: () => Promise<void>;
    transferICP: (to: Array<number>, amount: bigint, memo: bigint) => Promise<Result<bigint, string>>;
};
