import { ActorSubclass, Identity } from "@dfinity/agent";
import { createActor as metamobCreateActor, canisterId as metamobCanisterId } from "../../../declarations/metamob";
import { createActor as ledgerCreateActor, canisterId as ledgerCanisterId } from "../../../declarations/ledger";
import { createActor as mmtCreateActor, canisterId as mmtCanisterId } from "../../../declarations/mmt";
import { _SERVICE as Ledger } from "../../../declarations/ledger/ledger.did";
import { AuthClient } from "@dfinity/auth-client";
import { ICProvider } from "../interfaces/icprovider";
import { Result } from "../interfaces/result";
import { config } from "../config";
import { Principal } from "@dfinity/principal";
import { LEDGER_TRANSFER_FEE } from "../libs/backend";
import { transferErrorToText } from "../libs/icp";

class InternetIdentityProvider implements ICProvider {
    client?: AuthClient;
    identity?: Identity;
    ledger?: Ledger;
    
    public async initialize(
    ): Promise<boolean> {
        this.client = await AuthClient.create({idleOptions: {disableIdle: true}});
        return this.client !== undefined;
    }

    public async connect(
        options?: any
    ): Promise<Result<any, string>> {
        try {
            this.identity = this.client?.getIdentity();
            if(!this.identity) {
                return {err: 'IC Identity should not be null'};
            }
        }
        catch(e: any) {
            return {err: e.toString()};
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
    ): Promise<Result<any, string>> {
        const width = 500;
        const height = screen.height;
        const left = ((screen.width/2)-(width/2))|0;
        const top = ((screen.height/2)-(height/2))|0; 
        
        return new Promise((resolve) => {
            this.client?.login({
                identityProvider: config.II_URL,
                maxTimeToLive: BigInt(7 * 24) * BigInt(3_600_000_000_000), // 1 week
                windowOpenerFeatures: `toolbar=0,location=0,menubar=0,width=${width},height=${height},top=${top},left=${left}`,
                onSuccess: () => {
                    resolve({ok: null});
                },
                onError: (msg: string|undefined) => {
                    resolve({err: msg});
                 }
            });
        });
    }

    public async transferICP(
        to: Array<number>,
        amount: bigint,
        memo: bigint,
    ): Promise<Result<bigint, string>> {
        if(!this.ledger) {
            return {err: 'Ledger undefined'};
        }
        
        const res = await this.ledger?.transfer({
            to: to as any,
            amount: {e8s: amount},
            fee: {e8s: LEDGER_TRANSFER_FEE},
            memo: memo,
            from_subaccount: [],
            created_at_time: []
        });
    
        if('Err' in res) {
            return {err: `Transfer failed: ${transferErrorToText(res.Err)}`};
        }

        return {ok: res.Ok};
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
    
        this.ledger = ledgerCreateActor(ledgerCanisterId, {agentOptions: {identity: this.identity}});
        
        return this.ledger;
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