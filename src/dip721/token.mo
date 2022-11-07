import Array "mo:base/Array";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Order "mo:base/Order";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieSet "mo:base/TrieSet";
import Cap "./cap/Cap";
import Root "./cap/Root";
import Ledger "./ledger";
import Types "./types";

shared(msg) actor class Token(
    args: Types.InitArgs
) = this {

    let ledger: Ledger.Ledger = Ledger.Ledger(args);
    private var cap: ?Cap.Cap = null;
    
    // ==================================================================================================
    // metadata
    // ==================================================================================================
    public query func dip721_name(
    ): async ?Text {
        ledger.getMetadata().name;
    };

    public query func dip721_logo(
    ): async ?Text {
        ledger.getMetadata().logo;
    };

    public query func dip721_symbol(
    ): async ?Text {
        ledger.getMetadata().symbol;
    };

    public query func dip721_custodians(
    ): async [Principal] {
        TrieSet.toArray<Principal>(ledger.getMetadata().custodians);
    };

    public query func dip721_metadata(
    ): async Types.Metadata {
        ledger.getMetadata();
    };

    public shared(msg) func dip721_set_name(
        name: Text
    ): async Types.Result<()> {
        let md = ledger.getMetadata();
        ledger.setMetadata(
            {
                cap = md.cap;
                logo = md.logo;
                name = ?name;
                custodians = md.custodians;
                symbol = md.symbol;
                created_at = md.created_at;
                upgraded_at = Nat64.fromNat(Int.abs(Time.now()));
            }, 
            msg.caller
        )
    };

    public shared(msg) func dip721_set_logo(
        logo: Text
    ): async Types.Result<()> {
        let md = ledger.getMetadata();
        ledger.setMetadata(
            {
                cap = md.cap;
                logo = ?logo;
                name = md.name;
                custodians = md.custodians;
                symbol = md.symbol;
                created_at = md.created_at;
                upgraded_at = Nat64.fromNat(Int.abs(Time.now()));
            }, 
            msg.caller
        )
    };

    public shared(msg) func dip721_set_symbol(
        symbol: Text
    ): async Types.Result<()> {
        let md = ledger.getMetadata();
        ledger.setMetadata(
            {
                cap = md.cap;
                logo = md.logo;
                name = md.name;
                custodians = md.custodians;
                symbol = ?symbol;
                created_at = md.created_at;
                upgraded_at = Nat64.fromNat(Int.abs(Time.now()));
            }, 
            msg.caller
        )
    };

    public shared(msg) func dip721_set_custodians(
        custodians: [Principal]
    ): async Types.Result<()> {
        let md = ledger.getMetadata();
        ledger.setMetadata(
            {
                cap = md.cap;
                logo = md.logo;
                name = md.name;
                custodians = TrieSet.fromArray<Principal>(custodians, Principal.hash, Principal.equal);
                symbol = md.symbol;
                created_at = md.created_at;
                upgraded_at = Nat64.fromNat(Int.abs(Time.now()));
            }, 
            msg.caller
        )
    };

    // ==================================================================================================
    // stats
    // ==================================================================================================
    public query func dip721_total_supply(
    ): async Nat {
        ledger.tokensCount();
    };

    public query func dip721_total_transactions(
    ): async Nat {
        ledger.txCount();
    };

    public query func dip721_cycles(
    ): async Nat {
        ExperimentalCycles.balance();
    };

    public query func dip721_total_unique_holders(
    ): async Nat {
        ledger.ownersCount();
    };

    public func dip721_stats(
    ): async Types.Stats {
        {
            cycles = await dip721_cycles();
            total_transactions = await dip721_total_transactions();
            total_unique_holders = await dip721_total_unique_holders();
            total_supply = await dip721_total_supply();
        }
    };

    // ==================================================================================================
    // supported interfaces
    // ==================================================================================================
    public query func dip721_supported_interfaces(
    ): async [Types.SupportedInterface] {
        [#Approval, #Mint, #Burn]
    };

    // ==================================================================================================
    // balance
    // ==================================================================================================
    public query func dip721_balance_of(
        owner: Principal
    ): async Types.Result<Nat> {
        switch(ledger.getOwnerTokenIdentifiers(owner)) {
            case (#Err(msg)) {
                #Err(msg);
            };
            case (#Ok(ids)) {
                #Ok(TrieSet.size(ids));
            };
        };
    };

    // ==================================================================================================
    // token ownership
    // ==================================================================================================
    public query func dip721_owner_of(
        id: Types.TokenIdentifier
    ): async Types.Result<?Principal> {
        ledger.getOwnerOf(id);
    };

    public query func dip721_operator_of(
        id: Types.TokenIdentifier
    ): async Types.Result<?Principal> {
        ledger.getOperatorOf(id);
    };

    public query func dip721_owner_token_metadata(
        owner: Principal
    ): async Types.Result<[Types.TokenMetadata]> {
        ledger.getOwnerTokensMetadata(owner);
    };

    public query func dip721_operator_token_metadata(
        operator: Principal
    ): async Types.Result<[Types.TokenMetadata]> {
        ledger.getOperatorTokensMetadata(operator);
    };

    public query func dip721_owner_token_identifiers(
        owner: Principal
    ): async Types.Result<[Types.TokenIdentifier]> {
        switch(ledger.getOwnerTokenIdentifiers(owner)) {
            case (#Err(msg)) {
                #Err(msg);
            };
            case (#Ok(ids)) {
                #Ok(TrieSet.toArray(ids));
            };
        };
    };

    public query func dip721_operator_token_identifiers(
        operator: Principal
    ): async Types.Result<[Types.TokenIdentifier]> {
        switch(ledger.getOperatorTokenIdentifiers(operator)) {
            case (#Err(msg)) {
                #Err(msg);
            };
            case (#Ok(ids)) {
                #Ok(TrieSet.toArray(ids));
            };
        };
    };

    // ==================================================================================================
    // token metadata
    // ==================================================================================================
    public query func dip721_token_metadata(
        id: Types.TokenIdentifier
    ): async Types.Result<Types.TokenMetadata> {
        ledger.getTokenMetadata(id);
    };

    // ==================================================================================================
    // approved for all
    // ==================================================================================================
    public query func dip721_is_approved_for_all(
        owner: Principal,
        operator: Principal
    ): async Types.Result<Bool> {
        switch(ledger.getOwnerTokensMetadata(owner)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(tokens)) {
                for(token in tokens.vals()) {
                    switch(token.operator) {
                        case null { 
                            return #Ok(false); 
                        };
                        case (?op) {
                            if(not Principal.equal(operator, op)) {
                                return #Ok(false);
                            };
                        };
                    };
                };
            };
        };

        #Ok(true);
    };

    // ==================================================================================================
    // core api
    // ==================================================================================================
    public shared(msg) func dip721_approve(
        operator: Principal,
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        let caller = msg.caller;
        
        if(Principal.equal(operator, caller)) {
            return #Err(#SelfApprove);
        };

        switch(ledger.getOwnerOf(id)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(owner)) {
                switch(owner) {
                    case null {
                        return #Err(#UnauthorizedOwner);
                    };
                    case (?owner) {
                        if(not Principal.equal(owner, caller)) {
                            return #Err(#UnauthorizedOwner);
                        };  
                    };
                };
            };
        };

        let oldOperator = switch(ledger.getOperatorOf(id)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(op)) {
                op;
            };
        };

        switch(ledger.approve(caller, id, ?operator)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case _ {
            };
        };

        ledger.updateOperatorCache(id, oldOperator, ?operator);

        ignore _addRecord(
            caller,
            "approve",
            [
                ("operator", #Principal(operator)),
                ("token_identifier", #Text(Nat.toText(id)))
            ]
        );

        #Ok(ledger.incTx() - 1);
    };

    public shared(msg) func dip721_set_approval_for_all(
        operator: Principal,
        is_approved: Bool
    ): async Types.Result<Nat> {
        let caller = msg.caller;
        
        if(Principal.equal(operator, caller)) {
            return #Err(#SelfApprove);
        };

        switch(ledger.getOwnerTokenIdentifiers(caller)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(ids)) {
                for(id in TrieSet.toArray<Types.TokenIdentifier>(ids).vals()) {
                    let oldOperator = switch(ledger.getOperatorOf(id)) {
                        case (#Err(msg)) {
                            return #Err(msg);
                        };
                        case (#Ok(op)) {
                            op;
                        };
                    };
                    let newOperator = if is_approved ?operator else null;
                    
                    ledger.updateOperatorCache(id, oldOperator, newOperator);
                    
                    switch(ledger.approve(caller, id, newOperator)) {
                        case (#Err(msg)) {
                            return #Err(msg);
                        };
                        case _ {
                        };
                    };
                };
            };
        };

        ignore _addRecord(
            caller,
            "setApprovalForAll",
            [
                ("operator", #Principal(operator)),
                ("is_approved", if(is_approved) {#True} else {#False})
            ]
        );

        #Ok(ledger.incTx() - 1);
    };
    
    public shared(msg) func dip721_transfer(
        to: Principal,
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        let caller = msg.caller;
        
        if(Principal.equal(to, caller)) {
            return #Err(#SelfTransfer);
        };

        let oldOwner = switch(ledger.getOwnerOf(id)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(owner)) {
                switch(owner) {
                    case null {
                        return #Err(#UnauthorizedOwner);
                    };
                    case (?owner) {
                        if(not Principal.equal(owner, caller)) {
                            return #Err(#UnauthorizedOwner);
                        };  
                    };
                };
                owner;
            };
        };

        let oldOperator = switch(ledger.getOperatorOf(id)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(op)) {
                op;
            };
        };

        switch(ledger.transfer(caller, id, ?to)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case _ {
            };
        };

        ledger.updateOwnerCache(id, oldOwner, ?to);
        ledger.updateOperatorCache(id, oldOperator, null);

        ignore _addRecord(
            caller,
            "transfer",
            [
                ("owner", #Principal(caller)),
                ("to", #Principal(to)),
                ("token_identifier", #Text(Nat.toText(id)))
            ]
        );

        #Ok(ledger.incTx() - 1);
    };

    public shared(msg) func dip721_transfer_from(
        owner: Principal,
        to: Principal,
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        let caller = msg.caller;
        
        if(Principal.equal(to, owner)) {
            return #Err(#SelfTransfer);
        };

        let oldOwner = switch(ledger.getOwnerOf(id)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(oldOwner)) {
                switch(oldOwner) {
                    case null {
                        return #Err(#UnauthorizedOwner);
                    };
                    case (?oldOwner) {
                        if(not Principal.equal(oldOwner, owner)) {
                            return #Err(#UnauthorizedOwner);
                        };  
                    };
                };
                oldOwner;
            };
        };

        let oldOperator = switch(ledger.getOperatorOf(id)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(op)) {
                switch(op) {
                    case null {
                        return #Err(#UnauthorizedOperator);
                    };
                    case (?op) {
                        if(not Principal.equal(op,  caller)) {
                            return #Err(#UnauthorizedOperator);
                        };
                    };
                };
                op;
            };
        };

        switch(ledger.transfer(caller, id, ?to)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case _ {
            };
        };

        ledger.updateOwnerCache(id, oldOwner, ?to);
        ledger.updateOperatorCache(id, oldOperator, null);

        ignore _addRecord(
            caller,
            "transferFrom",
            [
                ("owner", #Principal(owner)),
                ("to", #Principal(to)),
                ("token_identifier", #Text(Nat.toText(id)))
            ]
        );

        #Ok(ledger.incTx() - 1);
    };

    public shared(msg) func dip721_mint(
        to: Principal,
        id: Types.TokenIdentifier,
        properties: [(Text, Types.GenericValue)]
    ): async Types.Result<Nat> {
        let caller = msg.caller;

        if(not _isCanisterCustodian(caller)) {
            return #Err(#UnauthorizedOwner);
        };

        if(ledger.tokenExists(id)) {
            return #Err(#ExistedNFT);
        };
        
        ledger.addTokenMetadata(
            id,
            {
                token_identifier = id;
                owner = ?to;
                operator = null;
                properties = properties;
                is_burned = false;
                minted_at = Nat64.fromNat(Int.abs(Time.now()));
                minted_by = caller;
                transferred_at = null;
                transferred_by = null;
                approved_at = null;
                approved_by = null;
                burned_at = null;
                burned_by = null;
            }
        );

        ledger.updateOwnerCache(id, null, ?to);

        ignore _addRecord(
            caller,
            "mint",
            [
                ("to", #Principal(to)),
                ("token_identifier", #Text(Nat.toText(id)))
            ]
        );

        #Ok(ledger.incTx() - 1);
    };

    public shared(msg) func dip721_burn(
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        let caller = msg.caller;
        
        let oldOwner = switch(ledger.getOwnerOf(id)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(owner)) {
                switch(owner) {
                    case null {
                        return #Err(#UnauthorizedOwner);
                    };
                    case (?owner) {
                        if(not Principal.equal(owner, caller)) {
                            return #Err(#UnauthorizedOwner);
                        };  
                    };
                };

                owner;
            };
        };

        let oldOperator = switch(ledger.getOperatorOf(id)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case (#Ok(op)) {
                op;
            };
        };

        switch(ledger.burn(caller, id)) {
            case (#Err(msg)) {
                return #Err(msg);
            };
            case _ {
            };
        };

        ledger.updateOwnerCache(id, oldOwner, null);
        ledger.updateOperatorCache(id, oldOperator, null);

        ignore _addRecord(
            caller,
            "burn",
            [
                ("token_identifier", #Text(Nat.toText(id)))
            ]
        );

        #Ok(ledger.incTx() - 1);
    };

    // ==================================================================================================
    // upgrade
    // ==================================================================================================
    stable var ledgerState: ?Types.State = null;
    
    system func preupgrade() {
        ledgerState := ?ledger.serialize();
    };

    system func postupgrade() {
        switch(ledgerState) {
            case null {};
            case (?state) {
                ledger.deserialize(state);
            };
        };
        ledgerState := null;
    };

    // ==================================================================================================
    // helpers
    // ==================================================================================================
    private func _isCanisterCustodian(
        caller: Principal
    ): Bool {
        TrieSet.mem<Principal>(ledger.getMetadata().custodians, caller, Principal.hash(caller), Principal.equal);
    };

    private func _addRecord(
        caller: Principal,
        op: Text, 
        details: [(Text, Root.DetailValue)]
    ): async () {
        let c = switch(cap) {
            case(?c) { c };
            case(_) { Cap.Cap(Principal.fromActor(this), 2_000_000_000_000) };
        };        

        ignore c.insert({
            operation = op;
            details = details;
            caller = caller;
        });
    };
};
