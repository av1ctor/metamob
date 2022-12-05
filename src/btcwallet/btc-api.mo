import ExCycles "mo:base/ExperimentalCycles";
import Types "types";

module {
    public func getCost(
        network: Types.Network,
        method: Types.Method
    ): Types.Cycles {
        switch(network) {
            case (#Regtest or #Testnet) {
                switch(method) {
                    case(#bitcoin_get_utxos) {
                        100_000_000;
                    };
                    case(#bitcoin_get_current_fee_percentiles) {
                        100_000_000;
                    };
                    case(#bitcoin_get_balance) {
                        100_000_000;
                    };
                    case(#bitcoin_send_transaction) {
                        5_000_000_000
                    };
                };
            };
            case (#Mainnet) {
                switch(method) {
                    case(#bitcoin_get_utxos) {
                        50_000_000 + 25_000_000;
                    };
                    case(#bitcoin_get_current_fee_percentiles) {
                        10_000_000;
                    };
                    case(#bitcoin_get_balance) {
                        10_000_000;
                    };
                    case(#bitcoin_send_transaction) {
                        5_000_000_000
                    };
                };
            };
        };
    };

    /// Actor definition to handle interactions with the management canister.
    type ManagementCanisterActor = actor {
        bitcoin_get_balance : Types.GetBalanceRequest -> async Types.Satoshi;
        bitcoin_get_utxos : Types.GetUtxosRequest -> async Types.GetUtxosResponse;
        bitcoin_get_current_fee_percentiles : Types.GetCurrentFeePercentilesRequest -> async [Types.MillisatoshiPerByte];
        bitcoin_send_transaction : Types.SendTransactionRequest -> async ();
    };

    let management_canister_actor : ManagementCanisterActor = actor("aaaaa-aa");

    public func get_balance(
        network: Types.Network, 
        address: Types.BitcoinAddress,
        min_confirmations : ?Nat32
    ): async Types.Satoshi {
        ExCycles.add(getCost(network, #bitcoin_get_balance));
        await management_canister_actor.bitcoin_get_balance({
            address;
            network;
            min_confirmations = min_confirmations;
        })
    };

    public func get_utxos(
        network: Types.Network, 
        address: Types.BitcoinAddress,
        filter: ?Types.UtxosFilter
    ): async Types.GetUtxosResponse {
        ExCycles.add(getCost(network, #bitcoin_get_utxos));
        await management_canister_actor.bitcoin_get_utxos({address; network; filter;})
    };

    public func get_current_fee_percentiles(
        network: Types.Network
    ): async [Types.MillisatoshiPerByte] {
        ExCycles.add(getCost(network, #bitcoin_get_current_fee_percentiles));
        await management_canister_actor.bitcoin_get_current_fee_percentiles({
            network;
        })
    };

    public func send_transaction(
        network: Types.Network, 
        transaction: [Nat8]
    ): async () {
        ExCycles.add(getCost(network, #bitcoin_send_transaction) + transaction.size() * Types.SEND_TRANSACTION_COST_CYCLES_PER_BYTE);
        await management_canister_actor.bitcoin_send_transaction({
            network;
            transaction;
        })
    };
}