import Principal "mo:base/Principal";
import TrieSet "mo:base/TrieSet";
import Text "mo:base/Text";
import BitcoinWallet "btc-wallet";
import BitcoinApi "btc-api";
import Types "types";
import Utils "utils";

shared(msg) actor class BtcWallet(
    _network: Types.Network,
    _custodians: [Principal]
) = this {
    
    stable let network : Types.Network = _network;
    stable let custodians: TrieSet.Set<Principal> = TrieSet.fromArray<Principal>(_custodians, Principal.hash, Principal.equal);

    let keyName: Text = switch network {
        case (#Regtest) "dfx_test_key";
        case _ "test_key_1"
    };

    public func getBalance(
        address: Types.BitcoinAddress
    ): async Types.Satoshi {
        await BitcoinApi.get_balance(network, address)
    };

    public func getUtxos(
        address: Types.BitcoinAddress
    ): async Types.GetUtxosResponse {
        await BitcoinApi.get_utxos(network, address)
    };

    public func getCurrentFee(
    ): async [Types.MillisatoshiPerByte] {
        await BitcoinApi.get_current_fee_percentiles(network)
    };

    public func getAddress(
        campaignId: Nat32, 
        userId: Nat32
    ): async Types.BitcoinAddress {
	    let path = [Utils.nat32ToArrayBE(campaignId), Utils.nat32ToArrayBE(userId)];
        await BitcoinWallet.get_p2pkh_address(network, keyName, path)
    };

    public func send(
        request: Types.SendRequest, 
        campaignId: Nat32, 
        userId: Nat32
    ): async Text {
        assert _isCustodian(msg.caller);
	    let path = [Utils.nat32ToArrayBE(campaignId), Utils.nat32ToArrayBE(userId)];
        Utils.bytesToText(await BitcoinWallet.send(network, path, keyName, request.destination_address, request.amount_in_satoshi))
    };

    func _isCustodian(
        caller: Principal
    ): Bool {
        TrieSet.mem<Principal>(custodians, caller, Principal.hash(caller), Principal.equal);
    };
};

