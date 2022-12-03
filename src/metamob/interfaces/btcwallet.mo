import Result "mo:base/Result";

module {
    public type BitcoinAddress = Text;
    public type Satoshi = Nat64;

    public type Callback = {
        act: Principal;
        method: Text;
        args: Blob;
    };

    public type Interface = actor {
        getAddress: (
            path: [[Nat8]]
        ) -> async BitcoinAddress;

        addPendingDeposit: (
            id: Text,
            address: BitcoinAddress,
            value: Satoshi,
            callback: Callback
        ) -> async Result.Result<(), Text>;

        transferToMainAccount: (
            path: [[Nat8]]
        ) -> async Text;
    };
};