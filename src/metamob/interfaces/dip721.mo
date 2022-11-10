module {
    public type GenericValue = {
        #Nat64Content : Nat64;
        #Nat32Content : Nat32;
        #BoolContent : Bool;
        #Nat8Content : Nat8;
        #Int64Content : Int64;
        #IntContent : Int;
        #NatContent : Nat;
        #Nat16Content : Nat16;
        #Int32Content : Int32;
        #Int8Content : Int8;
        #FloatContent : Float;
        #Int16Content : Int16;
        #BlobContent : Blob;
        #NestedContent : [GenericValue];
        #Principal : Principal;
        #TextContent : Text;
    };

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

    public type Result<T> = {
        #Ok: T; 
        #Err: NftError;
    };

    public type Interface = actor {
        balanceOf: (who: Principal) -> async Nat;
        transfer: (to: Principal, value: Nat) -> async Result<Nat>;
        transferFrom: (from: Principal, to: Principal, value: Nat) -> async Result<Nat>;
        mint: (to: Principal, id: Nat, properties: [(Text, GenericValue)]) -> async Result<Nat>
    };
    
};