import Array "mo:base/Array";
import ExperimentalCycles "mo:base/ExperimentalCycles";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Ledger "./ledger";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Order "mo:base/Order";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import TrieSet "mo:base/Blob";
import Cap "./cap/Cap";
import Root "./cap/Root";
import Types "./types";

shared(msg) actor class Token(
    args: Types.InitArgs
) = this {

    let ledger: Ledger.Ledger = Ledger.Ledger(args);
    let cap: Cap.Cap = Cap.Cap(Principal.fromActor(this), 2_000_000_000_000);
    
    ignore cap.performHandshake();

    // ==================================================================================================
    // metadata
    // ==================================================================================================
    public query func dip721_name(
    ): ?Text {
        ledger.getMetadata().name;
    };

    public query func dip721_logo(
    ): ?Text {
        ledger.getMetadata().logo;
    };

    public query func dip721_symbol(
    ): ?Text {
        ledger.getMetadata().symbol;
    };

    public query func dip721_custodians(
    ): [Principal] {
        TrieSet.toArray<Types.TokenIdentifier>(ledger.getMetadata().custodians);
    };

    public query func dip721_metadata(
    ): Types.Metadata {
        ledger.getMetadata();
    };

    public shared(msg) func dip721_set_name(
        name: Text
    ): Result.Result<(), Types.NftError> {
        let md = ledger.getMetadata();
        ledger.setMetadata(
            {
                cap = md.cap;
                logo = md.logo;
                name = ?name;
                custodians = md.custodians;
                symbol = md.symbol;
                created_at = md.created_at;
                upgraded_at = Time.now();
            }, 
            msg.caller
        );
    };

    public shared(msg) func dip721_set_logo(
        logo: Text
    ): Result.Result<(), Types.NftError> {
        let md = ledger.getMetadata();
        ledger.setMetadata(
            {
                cap = md.cap;
                logo = ?logo;
                name = md.name;
                custodians = md.custodians;
                symbol = md.symbol;
                created_at = md.created_at;
                upgraded_at = Time.now();
            }, 
            msg.caller
        );
    };

    public shared(msg) func dip721_set_symbol(
        symbol: Text
    ): Result.Result<(), Types.NftError> {
        let md = ledger.getMetadata();
        ledger.setMetadata(
            {
                cap = md.cap;
                logo = md.logo;
                name = md.name;
                custodians = md.custodians;
                symbol = ?symbol;
                created_at = md.created_at;
                upgraded_at = Time.now();
            }, 
            msg.caller
        );
    };

    public shared(msg) func dip721_set_custodians(
        custodians: [Principal]
    ): Result.Result<(), Types.NftError> {
        let md = ledger.getMetadata();
        ledger.setMetadata(
            {
                cap = md.cap;
                logo = md.logo;
                name = md.name;
                custodians = TrieSet.fromArray<Principal>(custodians, Principal.hash, Principal.equal);
                symbol = md.symbol;
                created_at = md.created_at;
                upgraded_at = Time.now();
            }, 
            msg.caller
        );
    };

    // ==================================================================================================
    // stats
    // ==================================================================================================
    public query func dip721_total_supply(
    ): Nat {
        ledger.tokensCount();
    };

    public query func dip721_total_transactions(
    ): Nat {
        ledger.txCount();
    };

    public query func dip721_cycles(
    ): Nat {
        ExperimentalCycles.balance();
    };

    public query func dip721_total_unique_holders(
    ): Nat {
        ledger.ownersCount();
    };

    public query func dip721_stats(
    ): Types.Stats {
        {
            cycles = dip721_cycles();
            total_transactions = dip721_total_transactions();
            total_unique_holders = dip721_total_unique_holders();
            total_supply = dip721_total_supply();
        }
    };

    // ==================================================================================================
    // supported interfaces
    // ==================================================================================================
    public query func dip721_supported_interfaces(
    ): [Types.SupportedInterface] {
        [#Approval, #Mint, #Burn]
    };

    // ==================================================================================================
    // balance
    // ==================================================================================================
    public query func dip721_balance_of(
        owner: Principal
    ): Result.Result<Nat, Types.NftError> {
        switch(ledger.getOwnerTokenIdentifiers(owner)) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(ids)) {
                ids.size();
            };
        };
    };

    // ==================================================================================================
    // token ownership
    // ==================================================================================================
    public query func dip721_owner_of(
        id: Types.TokenIdentifier
    ): Result.Result<?Principal, Types.NftError> {
        ledger.getOwnerOf(id);
    };

    public query func dip721_operator_of(
        id: Types.TokenIdentifier
    ): Result.Result<?Principal, Types.NftError> {
        ledger.getOperatorOf(id);
    };

    public query func dip721_owner_token_metadata(
        owner: Principal
    ): Result.Result<[Types.TokenMetadata], Types.NftError> {
        ledger.getOwnerTokensMetadata(owner);
    };

    public query func dip721_operator_token_metadata(
        operator: Principal
    ): Result.Result<[Types.TokenMetadata], Types.NftError> {
        ledger.getOperatorTokensMetadata(operator);
    };

    public query func dip721_owner_token_identifiers(
        owner: Principal
    ): Result.Result<[Types.TokenIdentifier], Types.NftError> {
        ledger.getOwnerTokenIdentifiers(owner);
    };

    public query func dip721_operator_token_identifiers(
        operator: Principal
    ): Result.Result<[Types.TokenIdentifier], Types.NftError> {
        ledger.getOperatorTokenIdentifiers(operator);
    };

    // ==================================================================================================
    // token metadata
    // ==================================================================================================
    public query func dip721_token_metadata(
        id: Types.TokenIdentifier
    ): Result.Result<Types.TokenMetadata, Types.NftError> {
        ledger.getTokenMetadata(id);
    };

    // ==================================================================================================
    // approved for all
    // ==================================================================================================
    public query func dip721_is_approved_for_all(
        owner: Principal,
        operator: Principal
    ): Result.Result<Bool, Types.NftError> {
        switch(ledger.getOwnerTokensMetadata(owner)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(tokens)) {
                for(token in tokens.vals()) {
                    switch(token.operator) {
                        case null { 
                            return #ok(false); 
                        };
                        case (?op) {
                            if(not Principal.equal(operator, op)) {
                                return #ok(false);
                            };
                        };
                    };
                };
            };
        };

        #ok(true);
    };

    // ==================================================================================================
    // core api
    // ==================================================================================================
    public shared(msg) func dip721_approve(
        operator: Principal,
        id: Types.TokenIdentifier
    ): Result.Result<Nat, Types.NftError> {
        let caller = msg.caller;
        
        if(Principal.equal(operator, caller)) {
            return #err(#SelfApprove);
        };

        switch(ledger.getOwnerOf(id)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(owner)) {
                switch(owner) {
                    case null {
                        return #err(#UnauthorizedOwner);
                    };
                    case (?owner) {
                        if(not Principal.equal(owner, caller)) {
                            return #err(#UnauthorizedOwner);
                        };  
                    };
                };
            };
        };

        let oldOperator = switch(ledger.getOperatorOf(id)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(op)) {
                op;
            };
        };

        switch(ledger.approve(caller, id, ?operator)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case _ {
            };
        };

        ledger.updateOperatorCache(id, oldOperator, ?operator);

        _addRecord(
            caller,
            "approve",
            [
                ("operator", operator.toText()),
                ("token_identifier", id.toText())
            ]
        );

        #ok(ledger.incTx() - 1);
    };

    public shared(msg) func dip721_set_approval_for_all(
        operator: Principal,
        is_approved: Bool
    ): Result.Result<Nat, Types.NftError> {
        let caller = msg.caller;
        
        if(Principal.equal(operator, caller)) {
            return #err(#SelfApprove);
        };

        switch(ledger.getOwnerTokenIdentifiers(caller)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(ids)) {
                for(id in TrieSet.toArray(ids).vals()) {
                    let oldOperator = switch(ledger.getOperatorOf(id)) {
                        case (#err(msg)) {
                            return #err(msg);
                        };
                        case (#ok(op)) {
                            op;
                        };
                    }
                    let newOperator = if is_approved ?operator else null;
                    
                    ledger.updateOperatorCache(id, oldOperator, newOperator);
                    
                    switch(ledger.approve(caller, id, ?newOperator)) {
                        case (#err(msg)) {
                            return #err(msg);
                        };
                        case _ {
                        };
                    };
                };
            };
        };

        _addRecord(
            caller,
            "setApprovalForAll",
            [
                ("operator", operator.toText()),
                ("is_approved", if is_approved "True" else "False")
            ]
        );

        #ok(ledger.incTx() - 1);
    };
    
    public shared(msg) func dip721_transfer(
        to: Principal,
        id: Types.TokenIdentifier
    ): Result.Result<Nat, Types.NftError> {
        let caller = msg.caller;
        
        if(Principal.equal(to, caller)) {
            return #err(#SelfTransfer);
        };

        let oldOwner = switch(ledger.getOwnerOf(id)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(owner)) {
                switch(owner) {
                    case null {
                        return #err(#UnauthorizedOwner);
                    };
                    case (?owner) {
                        if(not Principal.equal(owner, caller)) {
                            return #err(#UnauthorizedOwner);
                        };  
                    };
                };
                owner;
            };
        };

        let oldOperator = switch(ledger.getOperatorOf(id)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(op)) {
                op;
            };
        };

        switch(ledger.transfer(caller, id, ?to)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case _ {
            };
        };

        ledger.updateOwnerCache(id, oldOwner, ?to);
        ledger.updateOperatorCache(id, oldOperator, null);

        _addRecord(
            caller,
            "transfer",
            [
                ("owner", caller.toText()),
                ("to", to.toText()),
                ("token_identifier", id.toText())
            ]
        );

        #ok(ledger.incTx() - 1);
    };

    public shared(msg) func dip721_transfer_from(
        owner: Principal,
        to: Principal,
        id: Types.TokenIdentifier
    ): Result.Result<Nat, Types.NftError> {
        let caller = msg.caller;
        
        if(Principal.equal(to, owner)) {
            return #err(#SelfTransfer);
        };

        let oldOwner = switch(ledger.getOwnerOf(id)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(oldOwner)) {
                switch(oldOwner) {
                    case null {
                        return #err(#UnauthorizedOwner);
                    };
                    case (?oldOwner) {
                        if(not Principal.equal(oldOwner, owner)) {
                            return #err(#UnauthorizedOwner);
                        };  
                    };
                };
                oldOwner;
            };
        };

        let oldOperator = switch(ledger.getOperatorOf(id)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(op)) {
                switch(op) {
                    case null {
                        return #err(#UnauthorizedOperator);
                    };
                    case (?op) {
                        if(not Principal.equal(op,  caller)) {
                            return #err(#UnauthorizedOperator);
                        };
                    };
                };
                op;
            };
        };

        switch(ledger.transfer(caller, id, ?to)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case _ {
            };
        };

        ledger.updateOwnerCache(id, oldOwner, ?to);
        ledger.updateOperatorCache(id, oldOperator null);

        _addRecord(
            caller,
            "transferFrom",
            [
                ("owner", owner.toText()),
                ("to", to.toText()),
                ("token_identifier", id.toText())
            ]
        );

        #ok(ledger.incTx() - 1);
    };

    public shared(msg) func dip721_mint(
        to: Principal,
        id: Types.TokenIdentifier,
        properties: [{Text; Types.GenericValue}]
    ): Result.Result<Nat, Types.NftError> {
        let caller = msg.caller;

        if not _isCanisterCustodian(caller) {
            return #err(#UnauthorizedOwner);
        };

        if ledger.tokenExists(id) {
            return #err(#ExistedNFT);
        };
        
        ledger.addTokenMetadata(
            id,
            {
                token_identifier = id;
                owner = ?to;
                operator = null;
                properties = properties;
                is_burned = false;
                minted_at = Time.now();
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

        _addRecord(
            caller,
            "mint",
            [
                ("to", to.toText()),
                ("token_identifier", id.toText())
            ]
        );

        #ok(ledger.incTx() - 1);
    };

    public shared(msg) func dip721_burn(
        id: Types.TokenIdentifier
    ): Result.Result<Nat, Types.NftError> {
        let caller = msg.caller;
        
        let oldOwner = switch(ledger.getOwnerOf(id)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(owner)) {
                switch(owner) {
                    case null {
                        return #err(#UnauthorizedOwner);
                    };
                    case (?owner) {
                        if(not Principal.equal(owner, caller)) {
                            return #err(#UnauthorizedOwner);
                        };  
                    };
                };

                owner;
            };
        };

        let oldOperator = switch(ledger.getOperatorOf(id)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case (#ok(op)) {
                op;
            };
        };

        switch(ledger.burn(caller, id)) {
            case (#err(msg)) {
                return #err(msg);
            };
            case _ {
            };
        };

        ledger.updateOwnerCache(id, oldOwner, null);
        ledger.updateOperatorCache(id, oldOperator, null);

        _addRecord(
            caller,
            "burn",
            [
                ("token_identifier", id.toText())
            ]
        );

        #ok(ledger.incTx() - 1);
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
        TrieSet.mem<Principal>(ledger.getMetadata().custodians, caller, Principal.hash, Principal.equal);
    };

    private func _addRecord(
        caller: Principal,
        op: Text, 
        details: [(Text, Root.DetailValue)]
    ) {
        cap.insert_sync({
            operation = op;
            details = details;
            caller = caller;
        });
    };
};
