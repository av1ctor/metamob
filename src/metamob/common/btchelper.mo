import Result "mo:base/Result";
import BtcWallet "../interfaces/btcwallet";

module {
    public class BtcHelper(
        btcWalletCanisterId: Text
    ) {
        let wallet: BtcWallet.Interface = actor(btcWalletCanisterId);

        public func getAddress(
            path: [[Nat8]]
        ): async Text {
            await wallet.getAddress(path);
        };

        public func addPendingDeposit(
            id: Text,
            address: Text,
            value: Nat64,
            callback: BtcWallet.Callback
        ): async Result.Result<(), Text> {
            await wallet.addPendingDeposit(id, address, value, callback);
        };

        public func transferToMainAccount(
            path: [[Nat8]]
        ): async Text {
            await wallet.transferToMainAccount(path);
        };
    };
};