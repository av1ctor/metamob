import { ActorSubclass, Identity } from "@dfinity/agent";
import { createActor as metamobCreateActor, canisterId as metamobCanisterId } from "../../../declarations/metamob";
import { createActor as ledgerCreateActor, canisterId as ledgerCanisterId } from "../../../declarations/ledger";
import { createActor as mmtCreateActor, canisterId as mmtCanisterId } from "../../../declarations/mmt";
import { AuthClient } from "@dfinity/auth-client";
import { ICProvider } from "../interfaces/icprovider";
import { Result } from "../interfaces/result";
import { config } from "../config";
import { Principal } from "@dfinity/principal";

class InternetIdentityProvider implements ICProvider {
    client?: AuthClient;
    identity?: Identity;
    
    public async initialize(
    ): Promise<boolean> {
        this.client = await AuthClient.create({idleOptions: {disableIdle: true}});
        return this.client !== undefined;
    }

    public async connect(
        options?: any
    ): Promise<Result<any, string>> {
        this.identity = this.client?.getIdentity();
        if(!this.identity) {
            return {err: 'IC Identity should not be null'};
        }

        return {ok: null}
    } 

    public async isAuthenticated(
    ): Promise<boolean> {
        return await this.client?.isAuthenticated() || false;
    }

    public async createActor(
        id?: string
    ): Promise<any> {
        switch(id) {
            case metamobCanisterId:
                return this._createMainActor();
            case ledgerCanisterId:
                return this._createLedgerActor();
            case mmtCanisterId:
                return this._createMmtActor();
            default:
                return undefined;
        }
    }

    public getPrincipal(
    ): Principal | undefined {
        return this.identity?.getPrincipal();
    }

    public async login(
        onSuccess?: () => void, 
        onError?: (msg: string|undefined) => void
    ): Promise<void> {
        const width = 500;
        const height = screen.height;
        const left = ((screen.width/2)-(width/2))|0;
        const top = ((screen.height/2)-(height/2))|0; 
        
        this.client?.login({
            identityProvider: config.II_URL,
            maxTimeToLive: BigInt(7 * 24) * BigInt(3_600_000_000_000), // 1 week
            windowOpenerFeatures: `toolbar=0,location=0,menubar=0,width=${width},height=${height},top=${top},left=${left}`,
            onSuccess: onSuccess,
            onError: onError,
        });
    }

    public async logout(
    ): Promise<void> {
        await this.client?.logout();
    }

    private _createMainActor(
    ): ActorSubclass<any> {
        if(!metamobCanisterId) {
            throw Error('Metamob canister is undefined');
        }
    
        return metamobCreateActor(metamobCanisterId, {agentOptions: {identity: this.identity}})
    }
    
    private _createLedgerActor(
    ): ActorSubclass<any> {
        if(!ledgerCanisterId) {
            throw Error('Ledger canister id is undefined');
        }
    
        return ledgerCreateActor(ledgerCanisterId, {agentOptions: {identity: this.identity}})
    }
    
    private _createMmtActor(
    ): ActorSubclass<any> {
        if(!mmtCanisterId) {
            throw Error('MMT canister id is undefined');
        }
        
        return mmtCreateActor(mmtCanisterId, {agentOptions: {identity: this.identity}})
    }
};


export default InternetIdentityProvider;