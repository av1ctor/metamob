import Result "mo:base/Result";
import BtcWallet "../../btcwallet/types";
import ExCycles "mo:base/ExperimentalCycles";

module {
    public class BtcHelper(
        btcWalletCanisterId: Text
    ) {
        let wallet: BtcWallet.Interface = actor(btcWalletCanisterId);
        var addPendingDepositCost = 0;
        var transferToMainAccountCost = 0;
                
        func _getAddPendingDepositCost(
        ): async* Nat {
            if(addPendingDepositCost == 0) {
                addPendingDepositCost := await wallet.getCost(#addPendingDeposit);
            };
            addPendingDepositCost;
        };

        func _getTransferToMainAccountCost(
        ): async* Nat {
            if(transferToMainAccountCost == 0) {
                transferToMainAccountCost := await wallet.getCost(#transferToMainAccount);
            };
            transferToMainAccountCost
        };

        public func getAddress(
            path: [[Nat8]]
        ): async* Text {
            await wallet.getAddress(path);
        };

        public func addPendingDeposit(
            id: Text,
            address: Text,
            value: Nat64,
            callback: BtcWallet.Callback
        ): async* Result.Result<(), Text> {
            ExCycles.add(await* _getAddPendingDepositCost());
            await wallet.addPendingDeposit(id, address, value, callback);
        };

        public func transferToMainAccount(
            path: [[Nat8]]
        ): async* Text {
            ExCycles.add(await* _getTransferToMainAccountCost());
            await wallet.transferToMainAccount(path);
        };
    };
};