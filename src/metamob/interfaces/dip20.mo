import Principal "mo:base/Principal";

module {
    public type TxReceipt = {
        #Ok: Nat;
        #Err: {
            #InsufficientAllowance;
            #InsufficientBalance;
            #ErrorOperationStyle;
            #Unauthorized;
            #LedgerTrap;
            #ErrorTo;
            #Other: Text;
            #BlockUsed;
            #AmountTooSmall;
        };
    };
    
    public type Interface = actor {
        balanceOf: (who: Principal) -> async Nat;
        transfer: (to: Principal, value: Nat) -> async TxReceipt;
        transferFrom: (from: Principal, to: Principal, value: Nat) -> async TxReceipt;
        allowance: (principal: Principal, spender: Principal) -> async Nat;
        approve: (spender: Principal, value: Nat) -> async TxReceipt;
        getTokenFee: () -> async Nat;
    };
};