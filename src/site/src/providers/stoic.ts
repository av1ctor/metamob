import {StoicIdentity} from "ic-stoic-identity";
import { ActorSubclass } from "@dfinity/agent";
import { createActor as metamobCreateActor, canisterId as metamobCanisterId } from "../../../declarations/metamob";
import { createActor as ledgerCreateActor, canisterId as ledgerCanisterId } from "../../../declarations/ledger";
import { createActor as mmtCreateActor, canisterId as mmtCanisterId } from "../../../declarations/mmt";
import { _SERVICE as Ledger } from "../../../declarations/ledger/ledger.did";
import { ICProvider } from "../interfaces/icprovider";
import { Result } from "../interfaces/result";
import { Principal } from "@dfinity/principal";
import { LEDGER_TRANSFER_FEE } from "../libs/backend";
import { buildAgentJsOptions, transferErrorToText } from "../libs/icp";

class StoicProvider implements ICProvider {
    identity?: StoicIdentity;
    ledger?: Ledger;
    
    public async initialize(
    ): Promise<boolean> {
        return true;
    }

    public async connect(
        options?: any
    ): Promise<Result<any, string>> {
        try {
            this.identity = await StoicIdentity.load();
        }
        catch(e: any) {
            return {err: e.toString()};
        }

        return {ok: null}
    } 

    public async isAuthenticated(
    ): Promise<boolean> {
        return !!this.identity;
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
        try {
            this.identity = await StoicIdentity.connect();
            if(!this.identity) {
                return {err: 'Login failed, no identity return'};
            }
        }
        catch(e: any) {
            return {err: e.toString()};
        }

        return {ok: null};
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
        StoicIdentity.disconnect();
    }

    private _createMainActor(
    ): ActorSubclass<any> {
        if(!metamobCanisterId) {
            throw Error('Metamob canister is undefined');
        }
    
        return metamobCreateActor(metamobCanisterId, {agentOptions: buildAgentJsOptions(this.identity)})
    }
    
    private _createLedgerActor(
    ): ActorSubclass<any> {
        if(!ledgerCanisterId) {
            throw Error('Ledger canister id is undefined');
        }
    
        this.ledger = ledgerCreateActor(ledgerCanisterId, {agentOptions: buildAgentJsOptions(this.identity)});
        
        return this.ledger;
    }
    
    private _createMmtActor(
    ): ActorSubclass<any> {
        if(!mmtCanisterId) {
            throw Error('MMT canister id is undefined');
        }
        
        return mmtCreateActor(mmtCanisterId, {agentOptions: buildAgentJsOptions(this.identity)})
    }
};


export default StoicProvider;