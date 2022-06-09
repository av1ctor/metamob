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

    public func balanceOf(
        canisterId: Text,
        who: Principal
    ): async Nat {
        let dip721 = actor (canisterId) : Interface;
        await dip721.balanceOf(who);
    };

    public func transfer(
        canisterId: Text,
        to: Principal, 
        id: Nat
    ): async Result {
        let dip721 = actor (canisterId) : Interface;
        await dip721.transfer(to, id);
    };

    public func transferFrom(
        canisterId: Text,
        from: Principal, 
        to: Principal, 
        id: Nat
    ): async Result {
        let dip721 = actor (canisterId) : Interface;
        await dip721.transferFrom(from, to, id);
    };
};