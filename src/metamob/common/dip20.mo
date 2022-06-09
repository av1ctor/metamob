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
    };

    public func balanceOf(
        canisterId: Text,
        who: Principal
    ): async Nat {
        let dip20 = actor (canisterId) : Interface;
        await dip20.balanceOf(who);
    };

    public func transfer(
        canisterId: Text,
        to: Principal, 
        value: Nat
    ): async TxReceipt {
        let dip20 = actor (canisterId) : Interface;
        await dip20.transfer(to, value);
    };

    public func transferFrom(
        canisterId: Text,
        from: Principal, 
        to: Principal, 
        value: Nat
    ): async TxReceipt {
        let dip20 = actor (canisterId) : Interface;
        await dip20.transferFrom(from, to, value);
    };
};