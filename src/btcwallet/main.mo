import Iter "mo:base/Iter";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Int "mo:base/Int";
import Nat8 "mo:base/Nat8";
import Hash "mo:base/Hash";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import TrieMap "mo:base/TrieMap";
import TrieSet "mo:base/TrieSet";
import Text "mo:base/Text";
import IC "mo:base/ExperimentalInternetComputer";
import ExCycles "mo:base/ExperimentalCycles";
import BitcoinWallet "btc-wallet";
import BitcoinApi "btc-api";
import Types "types";
import Utils "utils";

shared(owner) actor class BtcWallet(
    network: Types.Network,
    minConfirmations: Nat32,
    _custodians: [Principal]
) = this {

    type PendingDeposit = {
        value: Types.Satoshi;
        account: {
            address: Types.BitcoinAddress;
            balance: Nat64;
            height: Nat32;
        };
        expiresAt: Int;
        callback: Types.Callback;
    };

    public type Method = {
        #addPendingDeposit;
        #transferToMainAccount;
    };

    let BITCOIN_BLOCK_TIME: Int = 10 * 60 * 1000_000_000; // 10 minutes
    let ONE_MINUTE: Int = 1 * 60 * 1000_000_000; // 1 minute
    let HEARTBEAT_INTERVAL: Nat = 60 * 1000_000_000; // 1 minute
    
    stable let custodians: TrieSet.Set<Principal> = TrieSet.fromArray<Principal>(_custodians, Principal.hash, Principal.equal);
    let pendingDeposits = TrieMap.TrieMap<Text, PendingDeposit>(Text.equal, Text.hash);
    let maxQueueTime: Int = (ONE_MINUTE * 5) + BITCOIN_BLOCK_TIME * Nat32.toNat(minConfirmations) + ONE_MINUTE;

    let keyName: Text = switch network {
        case (#Regtest) "dfx_test_key";
        case _ "test_key_1"
    };

    public shared(msg) func getAddress(
        path: [[Nat8]]
    ): async Types.BitcoinAddress {
	    assert _isCustodian(msg.caller);
        await* BitcoinWallet.get_p2pkh_address(network, keyName, path);
    };

    func _calcCost(
        method: Method
    ): Nat {
        switch(method) {
            case (#addPendingDeposit) {
                let executions = Int.abs(maxQueueTime / HEARTBEAT_INTERVAL);
                BitcoinApi.getCost(network, #bitcoin_get_balance) * executions + 
                    BitcoinApi.getCost(network, #bitcoin_get_utxos) * (executions / 2);
            };
            case (#transferToMainAccount) {
                BitcoinApi.getCost(network, #bitcoin_get_balance) + 
                    BitcoinApi.getCost(network, #bitcoin_get_current_fee_percentiles) +
                    BitcoinApi.getCost(network, #bitcoin_get_utxos) +
                    BitcoinApi.getCost(network, #bitcoin_send_transaction) + (128 * Types.SEND_TRANSACTION_COST_CYCLES_PER_BYTE);
            };
        };
    };

    public query func getCost(
        method: Method
    ): async Nat {
        _calcCost(method);
    };
    
    public shared(msg) func addPendingDeposit(
        id: Text,
        address: Types.BitcoinAddress,
        value: Types.Satoshi,
        callback: Types.Callback
    ): async Result.Result<(), Text> {
        assert _isCustodian(msg.caller);
        
        let cost = _calcCost(#addPendingDeposit);
        assert ExCycles.available() >= cost;
        ignore ExCycles.accept(cost);

        if(Option.isSome(pendingDeposits.get(id))) {
            return #err("Duplicated id");
        };

        pendingDeposits.put(id, {
            value = value;
            account = {
                address = address;
                height = await* _getAccountHeight(address);
                balance = await* _getAccountBalance(address);
            };
            expiresAt = Time.now() + maxQueueTime;
            callback = callback;
        });
        
        #ok();
    };

    public shared(msg) func transferToMainAccount(
        path: [[Nat8]]
    ): async Text {
        assert _isCustodian(msg.caller);
        
        let cost = _calcCost(#transferToMainAccount);
        assert ExCycles.available() >= cost;
        ignore ExCycles.accept(cost);

        let from = await* BitcoinWallet.get_p2pkh_address(network, keyName, path);
        let to = await* _getMainAccount();
        let balance = await* BitcoinApi.get_balance(network, from, ?minConfirmations);
        Utils.bytesToText(await* BitcoinWallet.send(network, path, keyName, to, balance))
    };

    func _getAccountHeight(
        address: Types.BitcoinAddress
    ): async* Nat32 {
        let utxos = (await* BitcoinApi.get_utxos(network, address, null)).utxos;
        if(utxos.size() == 0) {
            0;
        }
        else {
            utxos[0].height;
        };
    };

    func _getAccountBalance(
        address: Types.BitcoinAddress
    ): async* Nat64 {
        await* BitcoinApi.get_balance(network, address, ?minConfirmations);
    };

    func _getMainAccount(
    ): async* Types.BitcoinAddress {
        await* BitcoinWallet.get_p2pkh_address(network, keyName, []);
    };

    //
    // processing
    //
    func _processPendingDeposits(
    ): async* () {
        let now = Time.now();
        for(e in pendingDeposits.entries()) {
            let key = e.0;
            let deposit = e.1;
            if(deposit.expiresAt <= now) {
                pendingDeposits.delete(key);
                Debug.print("btcwallet.processPendingDeposits(): Pending deposit expired: " # key);
            }
            else {
                // first check if balance changed
                let balance = await* _getAccountBalance(deposit.account.address);
                if(balance != deposit.account.balance) {
                    // then check utxos
                    let utxos = (await* BitcoinApi.get_utxos(
                        network, 
                        deposit.account.address, 
                        ?#MinConfirmations(minConfirmations)
                    )).utxos;
                    for(utxo in utxos.vals()) {
                        if(utxo.height >= deposit.account.height and utxo.value == deposit.value) {
                            pendingDeposits.delete(key);
                            Debug.print("btcwallet.processPendingDeposits(): Pending deposit confirmed: " # key);
                            let cb = deposit.callback;
                            try {
                                ignore IC.call(cb.act, cb.method, cb.args);
                            }
                            catch(error: Error) {
                                Debug.print("btcwallet.processPendingDeposits(): Call to " # Principal.toText(cb.act) # "." # cb.method # "() failed: " # Error.message(error));
                            };
                        };
                    };
                };
            };
        };
    };

    func _isCustodian(
        caller: Principal
    ): Bool {
        TrieSet.mem<Principal>(custodians, caller, Principal.hash(caller), Principal.equal);
    };

    var lastExec: Nat = Int.abs(Time.now());
    var running: Bool = false;

    system func heartbeat(
    ): async () {
        let now = Int.abs(Time.now());
        if(now >= lastExec + HEARTBEAT_INTERVAL and not running) {
            running := true;
            lastExec := now;
            Debug.print("btcwallet.heartbeat(): Verifying...");
            try {
                await* _processPendingDeposits();
            }
            catch(e) {
                Debug.print("btcwallet.heartbeat() exception: " # Error.message(e));
            };
            running := false;
        };
    };

    //
    // migrations
    //
    stable var pendingDepositsEntries: [(Text, PendingDeposit)] = [];

    system func preupgrade() {
        pendingDepositsEntries := Iter.toArray(pendingDeposits.entries());
    };

    system func postupgrade() {
        for(e in pendingDepositsEntries.vals()) {
            pendingDeposits.put(e.0, e.1);
        };
        pendingDepositsEntries := [];
    };
};

