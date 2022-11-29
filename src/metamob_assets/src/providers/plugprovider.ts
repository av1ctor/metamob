import { ActorSubclass, Agent, HttpAgent } from "@dfinity/agent";
import { idlFactory as metamobIdlFactory, canisterId as metamobCanisterId } from "../../../declarations/metamob";
import { idlFactory as ledgerIdlFactory, canisterId as ledgerCanisterId } from "../../../declarations/ledger";
import { idlFactory as mmtIdlFactory, canisterId as mmtCanisterId } from "../../../declarations/mmt";
import { _SERVICE as Ledger } from "../../../declarations/ledger/ledger.did";
import { ICProvider } from "../interfaces/icprovider";
import { config } from "../config";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { Result } from "../interfaces/result";
import { LEDGER_TRANSFER_FEE } from "../libs/backend";
import { transferErrorToText } from "../libs/icp";

type RequestConnectOptions = {
    whitelist: Array<string>;
    host?: string;
    onConnectionUpdate?: () => void;
};

type Plug = {
    createActor: <T>(args: {
        canisterId: string, 
        interfaceFactory: IDL.InterfaceFactory
    }) => Promise<ActorSubclass<T>>;
    agent: Agent;
    createAgent: (options: {
        host: string, 
        whitelist: Array<string>
    }) => Promise<Agent>;
    getPrincipal: () => Promise<Principal>;
    isConnected: () => Promise<boolean>;
    disconnect: () => Promise<void>;
    requestConnect: (options: RequestConnectOptions) => Promise<string>;
    accountId: string;
    sessionManager: {
        sessionData: { 
            agent: HttpAgent, 
            principalId: string, 
            accountId: string 
        } | null;
    };
    requestTransfer: (args: {
        to: string,
        amount: number,
        opts?: {
            fee?: number,
            memo?: string,
            from_subaccount?: number,
            created_at_time?: {
                timestamp_nanos: number
            },
        },
    }) => Promise<{
        height: number
    }>;
    requestBalance: () => Promise<Array<{
        amount: number
        canisterId: string
        decimals: number
        image?: string
        name: string
        symbol: string
    }>>;
    getManagementCanister: () => Promise<ActorSubclass | undefined>;
  }

class PlugProvider implements ICProvider {
    plug?: Plug;
    config: RequestConnectOptions;
    ledger?: Ledger;

    constructor() {
        this.plug = window.ic?.plug;
        
        const whitelist: string[] = [metamobCanisterId];
        if(mmtCanisterId) {
            whitelist.push(mmtCanisterId);
        }
        if(ledgerCanisterId) {
            whitelist.push(ledgerCanisterId);
        }
        
        this.config = {
            whitelist,
            host: config.IC_URL
        };
    }
    
    public async initialize(
    ): Promise<boolean> {
        if(!this.plug) {
            return false;
        }

        return true;
    }

    public async connect(
        options?: any
    ): Promise<Result<any, string>> {
        return {ok: null};
    } 

    public async isAuthenticated(
    ): Promise<boolean> {
        return await this.plug?.isConnected() || false;
    }

    public async createActor(
        id?: string
    ): Promise<any> {
        if(!config.isProduction) {
            if(this.plug?.agent) {
                await this.plug?.agent.fetchRootKey();
            }
        }

        switch(id) {
            case metamobCanisterId:
                return await this._createMainActor();
            case ledgerCanisterId:
                return await this._createLedgerActor();
            case mmtCanisterId:
                return await this._createMmtActor();
            default:
                return undefined;
        }
    }

    public getPrincipal(
    ): Principal | undefined {
        const data = this.plug?.sessionManager.sessionData;
        return data? Principal.fromText(data.principalId): undefined;
    }

    public async login(
    ): Promise<Result<any, string>> {
        if(await this.plug?.isConnected()) {
            return {ok: null};
        }
        
        try {
            await this.plug?.requestConnect(this.config);

            return {ok: null};
            
        } catch (e: any) {
            return {err: e.toString()};
        }
    }

    public async transferICP(
        to: Array<number>,
        amount: bigint,
        memo: bigint,
    ): Promise<Result<bigint, string>> {
        //FIXME: it's not possible atm to pass a subaccount to plug.requestTransfer()
        
        if(!this.ledger) {
            return {err: 'Ledger undefined'};
        }
        
        const res = await this.ledger?.transfer({
            to: to,
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
        this.plug?.disconnect();
    }

    private async _createMainActor(
    ): Promise<ActorSubclass<any>> {
        if(!metamobCanisterId) {
            throw Error('Metamob canister is undefined');
        }

        return await this.plug?.createActor({
            canisterId: metamobCanisterId,
            interfaceFactory: metamobIdlFactory,
        });
    }
    
    private async _createLedgerActor(
    ): Promise<ActorSubclass<any>> {
        if(!ledgerCanisterId) {
            throw Error('Ledger canister id is undefined');
        }

        this.ledger = await this.plug?.createActor({
            canisterId: ledgerCanisterId,
            interfaceFactory: ledgerIdlFactory,
        });
    
        return this.ledger;
    }
    
    private async _createMmtActor(
    ): Promise<ActorSubclass<any>> {
        if(!mmtCanisterId) {
            throw Error('MMT canister id is undefined');
        }
        
        return await this.plug?.createActor({
            canisterId: mmtCanisterId,
            interfaceFactory: mmtIdlFactory,
        });
    }
};


export default PlugProvider;