import ExperimentalCycles "mo:base/ExperimentalCycles";

import Types "types";

module {
    type Cycles = Types.Cycles;
    type Satoshi = Types.Satoshi;
    type Network = Types.Network;
    type BitcoinAddress = Types.BitcoinAddress;
    type GetUtxosResponse = Types.GetUtxosResponse;
    type MillisatoshiPerByte = Types.MillisatoshiPerByte;
    type GetBalanceRequest = Types.GetBalanceRequest;
    type GetUtxosRequest = Types.GetUtxosRequest;
    type GetCurrentFeePercentilesRequest = Types.GetCurrentFeePercentilesRequest;
    type SendTransactionRequest = Types.SendTransactionRequest;

    // The fees for the various Bitcoin endpoints.
    let GET_BALANCE_COST_CYCLES : Cycles = 100_000_000;
    let GET_UTXOS_COST_CYCLES : Cycles = 100_000_000;
    let GET_CURRENT_FEE_PERCENTILES_COST_CYCLES : Cycles = 100_000_000;
    let SEND_TRANSACTION_BASE_COST_CYCLES : Cycles = 5_000_000_000;
    let SEND_TRANSACTION_COST_CYCLES_PER_BYTE : Cycles = 20_000_000;

    /// Actor definition to handle interactions with the management canister.
    type ManagementCanisterActor = actor {
        bitcoin_get_balance : GetBalanceRequest -> async Satoshi;
        bitcoin_get_utxos : GetUtxosRequest -> async GetUtxosResponse;
        bitcoin_get_current_fee_percentiles : GetCurrentFeePercentilesRequest -> async [MillisatoshiPerByte];
        bitcoin_send_transaction : SendTransactionRequest -> async ();
    };

    let management_canister_actor : ManagementCanisterActor = actor("aaaaa-aa");

    public func get_balance(
        network: Network, 
        address: BitcoinAddress,
        min_confirmations : ?Nat32
    ): async Satoshi {
        ExperimentalCycles.add(GET_BALANCE_COST_CYCLES);
        await management_canister_actor.bitcoin_get_balance({
            address;
            network;
            min_confirmations = min_confirmations;
        })
    };

    public func get_utxos(
        network: Network, 
        address: BitcoinAddress,
        filter: ?Types.UtxosFilter
    ): async GetUtxosResponse {
        ExperimentalCycles.add(GET_UTXOS_COST_CYCLES);
        await management_canister_actor.bitcoin_get_utxos({address; network; filter;})
    };

    public func get_current_fee_percentiles(
        network: Network
    ): async [MillisatoshiPerByte] {
        ExperimentalCycles.add(GET_CURRENT_FEE_PERCENTILES_COST_CYCLES);
        await management_canister_actor.bitcoin_get_current_fee_percentiles({
            network;
        })
    };

    public func send_transaction(
        network: Network, 
        transaction: [Nat8]
    ): async () {
        let transaction_fee =
            SEND_TRANSACTION_BASE_COST_CYCLES + transaction.size() * SEND_TRANSACTION_COST_CYCLES_PER_BYTE;

        ExperimentalCycles.add(transaction_fee);
        await management_canister_actor.bitcoin_send_transaction({
            network;
            transaction;
        })
    };
}