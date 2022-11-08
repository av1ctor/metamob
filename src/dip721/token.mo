// Copyright 2022 by André Vicentini (https://github.com/av1ctor)
// Released under the GPL-3.0 license
// Ported from https://github.com/Psychedelic/DIP721

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

    let ledger: Ledger.Ledger = Ledger.Ledger(args, msg.caller);
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

    private func _setName(
        name: Text,
        caller: Principal
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
            caller
        )
    };

    public shared(msg) func dip721_set_name(
        name: Text
    ): async Types.Result<()> {
        await _setName(name, msg.caller)
    };

    private func _setLogo(
        logo: Text,
        caller: Principal
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
            caller
        )
    };

    public shared(msg) func dip721_set_logo(
        logo: Text
    ): async Types.Result<()> {
        await _setLogo(logo, msg.caller)
    };

    private func _setSymbol(
        symbol: Text,
        caller: Principal
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
            caller
        )
    };

    public shared(msg) func dip721_set_symbol(
        symbol: Text
    ): async Types.Result<()> {
        await _setSymbol(symbol, msg.caller)
    };

    private func _setCustodians(
        custodians: [Principal],
        caller: Principal
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
            caller
        )
    };

    public shared(msg) func dip721_set_custodians(
        custodians: [Principal]
    ): async Types.Result<()> {
        await _setCustodians(custodians, msg.caller)
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

    public query func dip721_stats(
    ): async Types.Stats {
        {
            cycles = ExperimentalCycles.balance();
            total_transactions = ledger.txCount();
            total_unique_holders = ledger.ownersCount();
            total_supply = ledger.tokensCount();
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
    private func _isApprovedForAll(
        owner: Principal,
        operator: Principal
    ): Types.Result<Bool> {
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

    public query func dip721_is_approved_for_all(
        owner: Principal,
        operator: Principal
    ): async Types.Result<Bool> {
        _isApprovedForAll(owner, operator)
    };

    // ==================================================================================================
    // core api
    // ==================================================================================================
    private func _approve(
        operator: Principal,
        id: Types.TokenIdentifier,
        caller: Principal
    ): async Types.Result<Nat> {
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

    public shared(msg) func dip721_approve(
        operator: Principal,
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        await _approve(operator, id, msg.caller)
    };

    private func _setApprovalForAll(
        operator: Principal,
        is_approved: Bool, 
        caller: Principal
    ): async Types.Result<Nat> {
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

    public shared(msg) func dip721_set_approval_for_all(
        operator: Principal,
        is_approved: Bool
    ): async Types.Result<Nat> {
        await _setApprovalForAll(operator, is_approved, msg.caller)
    };
    
    private func _transfer(
        to: Principal,
        id: Types.TokenIdentifier,
        caller: Principal
    ): async Types.Result<Nat> {
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

    public shared(msg) func dip721_transfer(
        to: Principal,
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        await _transfer(to, id, msg.caller)
    };

    private func _transferFrom(
        owner: Principal,
        to: Principal,
        id: Types.TokenIdentifier,
        caller: Principal
    ): async Types.Result<Nat> {
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

    public shared(msg) func dip721_transfer_from(
        owner: Principal,
        to: Principal,
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        await _transferFrom(owner, to, id, msg.caller)
    };

    private func _mint(
        to: Principal,
        id: Types.TokenIdentifier,
        properties: [(Text, Types.GenericValue)],
        caller: Principal
    ): async Types.Result<Nat> {
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

    public shared(msg) func dip721_mint(
        to: Principal,
        id: Types.TokenIdentifier,
        properties: [(Text, Types.GenericValue)]
    ): async Types.Result<Nat> {
        await _mint(to, id, properties, msg.caller)
    };

    private func _burn(
        id: Types.TokenIdentifier,
        caller: Principal
    ): async Types.Result<Nat> {
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

    public shared(msg) func dip721_burn(
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        await _burn(id, msg.caller)
    };

    // ==================================================================================================
    // legacy
    // ==================================================================================================
    public query func name(
    ): async ?Text {
        ledger.getMetadata().name;
    };

    public query func logo(
    ): async ?Text {
        ledger.getMetadata().logo;
    };

    public query func symbol(
    ): async ?Text {
        ledger.getMetadata().symbol;
    };

    public query func custodians(
    ): async [Principal] {
        TrieSet.toArray<Principal>(ledger.getMetadata().custodians);
    };

    public query func metadata(
    ): async Types.Metadata {
        ledger.getMetadata();
    };

    public shared(msg) func setName(
        name: Text
    ): async Types.Result<()> {
        await _setName(name, msg.caller)
    };

    public shared(msg) func setLogo(
        logo: Text
    ): async Types.Result<()> {
        await _setLogo(logo, msg.caller)
    };

    public shared(msg) func setSymbol(
        symbol: Text
    ): async Types.Result<()> {
        await _setSymbol(symbol, msg.caller)
    };

    public shared(msg) func setCustodians(
        custodians: [Principal]
    ): async Types.Result<()> {
        await _setCustodians(custodians, msg.caller)
    };

    public query func totalSupply(
    ): async Nat {
        ledger.tokensCount();
    };

    public query func totalTransactions(
    ): async Nat {
        ledger.txCount();
    };

    public query func cycles(
    ): async Nat {
        ExperimentalCycles.balance();
    };

    public query func totalUniqueHolders(
    ): async Nat {
        ledger.ownersCount();
    };

    public query func stats(
    ): async Types.Stats {
        {
            cycles = ExperimentalCycles.balance();
            total_transactions = ledger.txCount();
            total_unique_holders = ledger.ownersCount();
            total_supply = ledger.tokensCount();
        }
    };

    public query func supportedInterfaces(
    ): async [Types.SupportedInterface] {
        [#Approval, #Mint, #Burn]
    };

    public query func balanceOf(
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

    public query func ownerOf(
        id: Types.TokenIdentifier
    ): async Types.Result<?Principal> {
        ledger.getOwnerOf(id);
    };

    public query func operatorOf(
        id: Types.TokenIdentifier
    ): async Types.Result<?Principal> {
        ledger.getOperatorOf(id);
    };

    public query func ownerTokenMetadata(
        owner: Principal
    ): async Types.Result<[Types.TokenMetadata]> {
        ledger.getOwnerTokensMetadata(owner);
    };

    public query func operatorTokenMetadata(
        operator: Principal
    ): async Types.Result<[Types.TokenMetadata]> {
        ledger.getOperatorTokensMetadata(operator);
    };

    public query func ownerTokenIdentifiers(
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

    public query func operatorTokenIdentifiers(
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

    public query func isApprovedForAll(
        owner: Principal,
        operator: Principal
    ): async Types.Result<Bool> {
        _isApprovedForAll(owner, operator)
    };

    public shared(msg) func approve(
        operator: Principal,
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        await _approve(operator, id, msg.caller)
    };

    public shared(msg) func setApprovalForAll(
        operator: Principal,
        is_approved: Bool
    ): async Types.Result<Nat> {
        await _setApprovalForAll(operator, is_approved, msg.caller)
    };

    public shared(msg) func transfer(
        to: Principal,
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        await _transfer(to, id, msg.caller)
    };

    public shared(msg) func transferFrom(
        owner: Principal,
        to: Principal,
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        await _transferFrom(owner, to, id, msg.caller)
    };

    public shared(msg) func mint(
        to: Principal,
        id: Types.TokenIdentifier,
        properties: [(Text, Types.GenericValue)]
    ): async Types.Result<Nat> {
        await _mint(to, id, properties, msg.caller)
    };

    public shared(msg) func burn(
        id: Types.TokenIdentifier
    ): async Types.Result<Nat> {
        await _burn(id, msg.caller)
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
