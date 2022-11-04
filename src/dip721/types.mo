import TrieSet "mo:base/TrieSet";
module {
    public type TokenIdentifier = Nat32;

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
        #FloatContent : Float64;
        #Int16Content : Int16;
        #BlobContent : Blob;
        #NestedContent : Vec;
        #Principal : Principal;
        #TextContent : Text;
    };

    public type InitArgs = {
        logo : ?Text;
        name : ?Text;
        custodians: [Principal];
        symbol: ?Text;
    };

    public type Metadata = {
        cap : ?Principal;
        logo : ?Text;
        name : ?Text;
        custodians: TrieSet.Set<Principal>;
        symbol: ?Text;
        created_at: Nat64;
        upgraded_at: Nat64;
    };

    public type NftError = {
        #UnauthorizedOperator;
        #SelfTransfer;
        #TokenNotFound;
        #UnauthorizedOwner;
        #SelfApprove;
        #OperatorNotFound;
        #ExistedNFT;
        #OwnerNotFound;
    };

    public type Stats = {
        cycles : Nat;
        total_transactions : Nat;
        total_unique_holders : Nat;
        total_supply : Nat;
    };

    public type SupportedInterface = { #Burn; #Mint; #Approval };
    
    public type TokenMetadata = {
        transferred_at : ?Nat64;
        transferred_by : ?Principal;
        owner : ?Principal;
        operator : ?Principal;
        approved_at : ?Nat64;
        approved_by : ?Principal;
        properties : [(Text; GenericValue)];
        is_burned : Bool;
        token_identifier : Nat;
        burned_at : ?Nat64;
        burned_by : ?Principal;
        minted_at : Nat64;
        minted_by : Principal;
    };

    public type State = {
        metadata: Metadata;
        tokens: [(TokenIdentifier, TokenMetadata)];
        tx_count: Nat;
    };
};