import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import TrieSet "mo:base/Blob";
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
            created_at = Time.now();
            upgraded_at = Time.now();
        };
        var tokens = HashMap.HashMap<Types.TokenIdentifier, Types.TokenMetadata>(1, Nat32.equal, Nat32.hash);
        var owners = HashMap.HashMap<Principal, TrieSet.Set<Types.TokenIdentifier>(1, Principal.equal, Principal.hash);
        var operators = HashMap.HashMap<Principal, TrieSet.Set<Types.TokenIdentifier>(1, Principal.equal, Principal.hash);
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
            metadata = state.metadata;
            for(e in state.tokens.vals()) {
                let id = e.0;
                let token = e.1;
                tokens.put(id, token);
                updateOwnerCache(id, null, token.owner);
                updateOperatorCache(id, null, token.operator);
            };
            tx_count = state.tx_count;
        };

        public func getMetadata(
        ): Types.Metadata {
            metadata
        };

        public func setMetadata(
            data: Types.Metadata,
            caller: Principal
        ): Result.Result<(), Types.NftError> {
            if(not TrieSet.mem<Principal>(metadata, caller, Principal.hash, Principal.equal)) {
                #err(#UnauthorizedOwner);
            }
            else {
                #ok();
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
        ): Result.Result<Types.TokenIdentifier, Types.NftError> {
            switch(tokens.get(id)) {
                case null {
                    #err(#TokenNotFound);
                };
                case (?token) {
                    #ok(token);
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
        ): Result.Result<TrieSet.Set<Types.TokenIdentifier>, Types.NftError> {
            switch(owners.get(owner)) {
                case null {
                    #err(#OwnerNotFound);
                };
                case (?ids) {
                    #ok(ids);
                };
            };
        };

        public func getOwnerOf(
            id: Types.TokenIdentifier
        ): Result.Result<?Principal, Types.NftError> {
            switch(tokens.get(id)) {
                case null {
                    #err(#TokenNotFound);
                };
                case (?token) {
                    #ok(token.owner);
                };
            };
        };

        public func getOwnerTokensMetadata(
            owner: Principal
        ): Result.Result<[Types.TokenMetadata], Types.NftError> {
            switch(owners.get(owner)) {
                case null {
                    #err(#OwnerNotFound);
                };
                case (?ids) {
                    let arr = TrieSet.toArray<Types.TokenIdentifier>(ids);
                    #ok(Array.tabulate<Types.TokenMetadata>(arr.size(), func (i: Nat): Types.TokenMetadata {
                        switch(tokens.get(arr[i])) {
                            case null {
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
                            case {?token} {
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
                            let set = TrieSet.delete<Types.TokenIdentifier>(ids, id, Nat32.hash, Nat32.equal);
                            if set.size() == 0 {
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
                            owners.put(newOwner, TrieSet.put(TrieSet.empty<Types.TokenIdentifier>(), id, Nat32.hash, Nat32.equal));
                        };
                        case (?ids) {
                            ignore owners.replace(newOwner, TrieSet.put(ids, id, Nat32.hash, Nat32.equal));
                        };
                    };
                };
            };
        };

        public func getOperatorTokenIdentifiers(
            operator: Principal
        ): Result.Result<TrieSet.Set<Types.TokenIdentifier>, Types.NftError> {
            switch(operators.get(operator)) {
                case null {
                    #err(#OperatorNotFound);
                };
                case (?ids) {
                    #ok(ids);
                };
            };
        };

        public func getOperatorOf(
            id: Types.TokenIdentifier
        ): Result.Result<?Principal, Types.NftError> {
            switch(tokens.get(id)) {
                case null {
                    #err(#TokenNotFound);
                };
                case (?token) {
                    #ok(token.operator);
                };
            };
        };

        public func getOperatorTokensMetadata(
            operator: Principal
        ): Result.Result<[Types.TokenMetadata], Types.NftError> {
            switch(operators.get(operator)) {
                case null {
                    #err(#OperatorNotFound);
                };
                case (?ids) {
                    let arr = TrieSet.toArray<Types.TokenIdentifier>(ids);
                    #ok(Array.tabulate<Types.TokenMetadata>(arr.size(), func (i: Nat): Types.TokenMetadata {
                        switch(tokens.get(arr[i])) {
                            case null {
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
                            case {?token} {
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
                            let set = TrieSet.delete<Types.TokenIdentifier>(ids, id, Nat32.hash, Nat32.equal);
                            if set.size() == 0 {
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
                            operators.put(newOperator, TrieSet.put(TrieSet.empty<Types.TokenIdentifier>(), id, Nat32.hash, Nat32.equal));
                        };
                        case (?ids) {
                            ignore operators.replace(newOperator, TrieSet.put(ids, id, Nat32.hash, Nat32.equal));
                        };
                    };
                };
            };
        };

        public func approve(
            approvedBy: Principal,
            id: Types.TokenIdentifier,
            newOperator: ?Principal
        ): Result.Result<(), Types.NftError> {
            switch(tokens.get(id)) {
                case null {
                    #err(#TokenNotFound);
                };
                case (?token) {
                    ignore tokens.replace(id, {
                        transferred_at = token.transferred_at;
                        transferred_by = token.transferred_by;
                        owner = token.owner;
                        operator = newOperator;
                        approved_at = ?Time.now();
                        approved_by = ?approvedBy;
                        properties = token.properties;
                        is_burned = token.is_burned;
                        token_identifier = token.token_identifier;
                        burned_at = token.burned_at;
                        burned_by = token.burned_by;
                        minted_at = token.minted_at;
                        minted_by = token.minted_by;
                    });
                    #ok();
                };
            };
        };

        public func transfer(
            transferredBy: Principal,
            id: Types.TokenIdentifier,
            newOwner: ?Principal
        ): Result.Result<(), Types.NftError> {
            switch(tokens.get(id)) {
                case null {
                    #err(#TokenNotFound);
                };
                case (?token) {
                    ignore tokens.replace(id, {
                        transferred_at = ?Time.now();
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
                    #ok();
                };
            };
        };

        public func burn(
            burnedBy: Principal,
            id: Types.TokenIdentifier
        ): Result.Result<(), Types.NftError> {
            switch(tokens.get(id)) {
                case null {
                    #err(#TokenNotFound);
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
                        burned_at = ?Time.now();
                        burned_by = ?burnedBy;
                        minted_at = token.minted_at;
                        minted_by = token.minted_by;
                    });  
                    #ok();
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