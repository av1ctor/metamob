module {
    public type NftError = {
        #UnauthorizedOperator;
        #SelfTransfer;
        #TokenNotFound;
        #UnauthorizedOwner;
        #TxNotFound;
        #SelfApprove;
        #OperatorNotFound;
        #ExistedNFT;
        #OwnerNotFound;
        #Other: Text;
    };

    public type Result = {
        #Ok: Nat; 
        #Err: NftError;
    };

    public type Interface = actor {
        balanceOf: (who: Principal) -> async Nat;
        transfer: (to: Principal, value: Nat) -> async Result;
        transferFrom: (from: Principal, to: Principal, value: Nat) -> async Result;
    };
};