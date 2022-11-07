import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import TrieSet "mo:base/TrieSet";
import Iter "mo:base/Iter";
import Cap "./cap/Cap";
import Types "./types";

module Ledger {
    public class Ledger(
        args: Types.InitArgs
    ) {
        var metadata: Types.Metadata = {
            cap = null;
            logo = args.logo;
            name = args.name;
            custodians = TrieSet.fromArray<Principal>(args.custodians, Principal.hash, Principal.equal);
            symbol = args.symbol;
            created_at = Nat64.fromNat(Int.abs(Time.now()));
            upgraded_at = Nat64.fromNat(Int.abs(Time.now()));
        };
        var tokens = HashMap.HashMap<Types.TokenIdentifier, Types.TokenMetadata>(1, Nat.equal, Nat32.fromNat);
        var owners = HashMap.HashMap<Principal, TrieSet.Set<Types.TokenIdentifier>>(1, Principal.equal, Principal.hash);
        var operators = HashMap.HashMap<Principal, TrieSet.Set<Types.TokenIdentifier>>(1, Principal.equal, Principal.hash);
        var tx_count: Nat = 0;

        public func serialize(
        ): Types.State {
            {
                metadata = metadata;
                tokens = Iter.toArray(tokens.entries());
                tx_count = tx_count;
            }
        };

        public func deserialize(
            state: Types.State
        ) {
            metadata := state.metadata;
            for(e in state.tokens.vals()) {
                let id = e.0;
                let token = e.1;
                tokens.put(id, token);
                updateOwnerCache(id, null, token.owner);
                updateOperatorCache(id, null, token.operator);
            };
            tx_count := state.tx_count;
        };

        public func getMetadata(
        ): Types.Metadata {
            metadata
        };

        public func setMetadata(
            data: Types.Metadata,
            caller: Principal
        ): Types.Result<()> {
            if(not TrieSet.mem<Principal>(metadata.custodians, caller, Principal.hash(caller), Principal.equal)) {
                #Err(#UnauthorizedOwner);
            }
            else {
                metadata := data;
                #Ok();
            };
        };

        public func tokensCount(
        ): Nat {
            tokens.size()
        };

        public func txCount(
        ): Nat {
            tx_count
        };

        public func tokenExists(
            id: Types.TokenIdentifier
        ): Bool {
            switch(tokens.get(id)) {
                case null false;
                case _ true;
            };
        };

        public func getTokenMetadata(
            id: Types.TokenIdentifier
        ): Types.Result<Types.TokenMetadata> {
            switch(tokens.get(id)) {
                case null {
                    #Err(#TokenNotFound);
                };
                case (?token) {
                    #Ok(token);
                };
            };
        };

        public func addTokenMetadata(
            id: Types.TokenIdentifier,
            data: Types.TokenMetadata
        ) {
            tokens.put(id, data);
        };

        public func ownersCount(
        ): Nat {
            owners.size()
        };

        public func getOwnerTokenIdentifiers(
            owner: Principal
        ): Types.Result<TrieSet.Set<Types.TokenIdentifier>> {
            switch(owners.get(owner)) {
                case null {
                    #Err(#OwnerNotFound);
                };
                case (?ids) {
                    #Ok(ids);
                };
            };
        };

        public func getOwnerOf(
            id: Types.TokenIdentifier
        ): Types.Result<?Principal> {
            switch(tokens.get(id)) {
                case null {
                    #Err(#TokenNotFound);
                };
                case (?token) {
                    #Ok(token.owner);
                };
            };
        };

        public func getOwnerTokensMetadata(
            owner: Principal
        ): Types.Result<[Types.TokenMetadata]> {
            switch(owners.get(owner)) {
                case null {
                    #Err(#OwnerNotFound);
                };
                case (?ids) {
                    let arr = TrieSet.toArray<Types.TokenIdentifier>(ids);
                    #Ok(Array.tabulate<Types.TokenMetadata>(arr.size(), func (i: Nat): Types.TokenMetadata {
                        switch(tokens.get(arr[i])) {
                            case null {
                                {
                                    transferred_at = null;
                                    transferred_by = null;
                                    owner = null;
                                    operator = null;
                                    approved_at = null;
                                    approved_by = null;
                                    properties = [];
                                    is_burned = false;
                                    token_identifier = 0;
                                    burned_at = null;
                                    burned_by = null;
                                    minted_at = 0;
                                    minted_by = owner;
                                };
                            };
                            case (?token) {
                                token;
                            };
                        };
                    }));
                };
            };
        };

        public func updateOwnerCache(
            id: Types.TokenIdentifier,
            oldOwner: ?Principal,
            newOwner: ?Principal
        ) {
            switch(oldOwner) {
                case null {};
                case (?oldOwner) {
                    switch(owners.get(oldOwner)) {
                        case null {
                        };
                        case (?ids) {
                            let set = TrieSet.delete<Types.TokenIdentifier>(ids, id, Hash.hash(id), Nat.equal);
                            if(TrieSet.size(set) == 0) {
                                owners.delete(oldOwner);
                            } 
                            else {
                                ignore owners.replace(oldOwner, set);
                            };
                        };
                    };
                };
            };

            switch(newOwner) {
                case null {};
                case (?newOwner) {
                    switch(owners.get(newOwner)) {
                        case null {
                            owners.put(newOwner, TrieSet.put<Types.TokenIdentifier>(TrieSet.empty<Types.TokenIdentifier>(), id, Hash.hash(id), Nat.equal));
                        };
                        case (?ids) {
                            ignore owners.replace(newOwner, TrieSet.put<Types.TokenIdentifier>(ids, id, Hash.hash(id), Nat.equal));
                        };
                    };
                };
            };
        };

        public func getOperatorTokenIdentifiers(
            operator: Principal
        ): Types.Result<TrieSet.Set<Types.TokenIdentifier>> {
            switch(operators.get(operator)) {
                case null {
                    #Err(#OperatorNotFound);
                };
                case (?ids) {
                    #Ok(ids);
                };
            };
        };

        public func getOperatorOf(
            id: Types.TokenIdentifier
        ): Types.Result<?Principal> {
            switch(tokens.get(id)) {
                case null {
                    #Err(#TokenNotFound);
                };
                case (?token) {
                    #Ok(token.operator);
                };
            };
        };

        public func getOperatorTokensMetadata(
            operator: Principal
        ): Types.Result<[Types.TokenMetadata]> {
            switch(operators.get(operator)) {
                case null {
                    #Err(#OperatorNotFound);
                };
                case (?ids) {
                    let arr = TrieSet.toArray<Types.TokenIdentifier>(ids);
                    #Ok(Array.tabulate<Types.TokenMetadata>(arr.size(), func (i: Nat): Types.TokenMetadata {
                        switch(tokens.get(arr[i])) {
                            case null {
                                {
                                    transferred_at = null;
                                    transferred_by = null;
                                    owner = null;
                                    operator = null;
                                    approved_at = null;
                                    approved_by = null;
                                    properties = [];
                                    is_burned = false;
                                    token_identifier = 0;
                                    burned_at = null;
                                    burned_by = null;
                                    minted_at = 0;
                                    minted_by = operator;
                                };
                            };
                            case (?token) {
                                token;
                            };
                        };
                    }));
                };
            };
        };

        public func updateOperatorCache(
            id: Types.TokenIdentifier,
            oldOperator: ?Principal,
            newOperator: ?Principal
        ) {
            switch(oldOperator) {
                case null {};
                case (?oldOperator) {
                    switch(operators.get(oldOperator)) {
                        case null {
                        };
                        case (?ids) {
                            let set = TrieSet.delete<Types.TokenIdentifier>(ids, id, Hash.hash(id), Nat.equal);
                            if(TrieSet.size(set) == 0) {
                                operators.delete(oldOperator);
                            } 
                            else {
                                ignore operators.replace(oldOperator, set);
                            };
                        };
                    };
                };
            };

            switch(newOperator) {
                case null {};
                case (?newOperator) {
                    switch(operators.get(newOperator)) {
                        case null {
                            operators.put(newOperator, TrieSet.put<Types.TokenIdentifier>(TrieSet.empty<Types.TokenIdentifier>(), id, Hash.hash(id), Nat.equal));
                        };
                        case (?ids) {
                            ignore operators.replace(newOperator, TrieSet.put<Types.TokenIdentifier>(ids, id, Hash.hash(id), Nat.equal));
                        };
                    };
                };
            };
        };

        public func approve(
            approvedBy: Principal,
            id: Types.TokenIdentifier,
            newOperator: ?Principal
        ): Types.Result<()> {
            switch(tokens.get(id)) {
                case null {
                    #Err(#TokenNotFound);
                };
                case (?token) {
                    ignore tokens.replace(id, {
                        transferred_at = token.transferred_at;
                        transferred_by = token.transferred_by;
                        owner = token.owner;
                        operator = newOperator;
                        approved_at = ?Nat64.fromNat(Int.abs(Time.now()));
                        approved_by = ?approvedBy;
                        properties = token.properties;
                        is_burned = token.is_burned;
                        token_identifier = token.token_identifier;
                        burned_at = token.burned_at;
                        burned_by = token.burned_by;
                        minted_at = token.minted_at;
                        minted_by = token.minted_by;
                    });
                    #Ok();
                };
            };
        };

        public func transfer(
            transferredBy: Principal,
            id: Types.TokenIdentifier,
            newOwner: ?Principal
        ): Types.Result<()> {
            switch(tokens.get(id)) {
                case null {
                    #Err(#TokenNotFound);
                };
                case (?token) {
                    ignore tokens.replace(id, {
                        transferred_at = ?Nat64.fromNat(Int.abs(Time.now()));
                        transferred_by = ?transferredBy;
                        owner = newOwner;
                        operator = token.operator;
                        approved_at = token.approved_at;
                        approved_by = token.approved_by;
                        properties = token.properties;
                        is_burned = token.is_burned;
                        token_identifier = token.token_identifier;
                        burned_at = token.burned_at;
                        burned_by = token.burned_by;
                        minted_at = token.minted_at;
                        minted_by = token.minted_by;
                    });
                    #Ok();
                };
            };
        };

        public func burn(
            burnedBy: Principal,
            id: Types.TokenIdentifier
        ): Types.Result<()> {
            switch(tokens.get(id)) {
                case null {
                    #Err(#TokenNotFound);
                };
                case (?token) {
                    ignore tokens.replace(id, {
                        transferred_at = token.transferred_at;
                        transferred_by = token.transferred_by;
                        owner = null;
                        operator = null;
                        approved_at = token.approved_at;
                        approved_by = token.approved_by;
                        properties = token.properties;
                        is_burned = true;
                        token_identifier = token.token_identifier;
                        burned_at = ?Nat64.fromNat(Int.abs(Time.now()));
                        burned_by = ?burnedBy;
                        minted_at = token.minted_at;
                        minted_by = token.minted_by;
                    });  
                    #Ok();
                };
            };
        };

        public func incTx(
        ): Nat {
            tx_count += 1;
            tx_count
        };
    };
};