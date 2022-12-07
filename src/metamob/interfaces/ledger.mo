module {
    public let CANISTER_ID : Text = "ryjl3-tyaaa-aaaaa-aaaba-cai";

    public type Result<T, E> = {
        #Ok  : T;
        #Err : E;
    };

    public type TransferResult = Result<BlockIndex, TransferError>;

    public type ICP = {
        e8s : Nat64;
    };

    public type Timestamp = {
        timestamp_nanos: Nat64;
    };

    public type AccountIdentifier = Blob;
    public type SubAccount = Blob;
    public type BlockIndex = Nat64;
    public type Memo = Nat64;

    public type TransferArgs = {
        memo : Memo;
        amount : ICP;
        fee : ICP;
        from_subaccount : ?SubAccount;
        to : AccountIdentifier;
        created_at_time : ?Timestamp;
    };

    public type TransferError = {
        #BadFee : { expected_fee : ICP };
        #InsufficientFunds : { balance: ICP };
        #TxTooOld : { allowed_window_nanos: Nat64 };
        #TxCreatedInFuture;
        #TxDuplicate : { duplicate_of: BlockIndex; };
    };


    public type AccountBalanceArgs = {
        account : AccountIdentifier;
    };

    public type Interface = actor {
        transfer        : TransferArgs       -> async TransferResult;
        account_balance : AccountBalanceArgs -> async ICP;
    };
};