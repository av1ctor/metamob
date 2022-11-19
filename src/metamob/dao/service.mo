import Nat64 "mo:base/Nat64";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Error "mo:base/Error";
import D "mo:base/Debug";
import Variant "mo:mo-table/variant";
import DIP20 "../interfaces/dip20";
import Types "./types";
import UserTypes "../users/types";
import Config "./config";
import Logger "../../logger/logger";

module {
    public class Service(
        mmtCanisterId: Text,
        logger: Logger.Logger
    ) {
        public let config = Config.Config();
        public let mmt = actor (mmtCanisterId) : DIP20.Interface;
        let staked = HashMap.HashMap<Principal, Nat>(1000, Principal.equal, Principal.hash);
        let deposited = HashMap.HashMap<Principal, Nat>(1000, Principal.equal, Principal.hash);
        
        // default values
        config.set("REPORTER_REWARD",               #nat64(   1_00000000)); // 1 MMT
        config.set("MODERATOR_MIN_STAKE",           #nat64(1000_00000000)); // 1000 MMT
        config.set("MODERATOR_REWARD",              #nat64(  10_00000000)); // 10 MMT
        config.set("MODERATOR_PUNISHMENT",          #nat64( 100_00000000)); // 100 MMT
        config.set("REPORT_MODERATING_SPAN",        #int(30*24*60*60*1000*1000*1000)); // 30 days in nanoseconds
        config.set("CHALLENGER_DEPOSIT",            #nat64( 100_00000000)); // 100 MMT
        config.set("CHALLENGE_MAX_JUDGES",          #nat32(3));
        config.set("CHALLENGE_JUDGE_PUNISHMENT",    #nat64( 100_00000000)); // 100 MMT
        config.set("CHALLENGE_VOTING_SPAN",         #int(30*24*60*60*1000*1000*1000)); // 30 days in nanoseconds
        config.set("POAP_DEPLOYING_PRICE",          #nat64(  10_00000000)); // 10 ICP
        config.set("POAP_DEPLOYING_CYCLES",         #nat64(300_000_000_000)); // 300B cycles
        config.set("POAP_MINTING_MIN_PRICE",        #nat64(   1_00000000)); // 1 ICP
        config.set("POAP_MINTING_TAX",              #nat64(30));            // 30%

        public func configSet(
            key: Text,
            value: Variant.Variant,
            invoker: Principal
        ) {
            //TODO: validate invoker
            config.set(key, value);
        };

        public func configGet(
            key: Text,
            invoker: Principal
        ): ?Variant.Variant {
            config.get(key);
        };

        public func configGetAsNat32(
            key: Text
        ): Nat32 {
            config.getAsNat32(key);
        };
        
        public func configGetAsNat64(
            key: Text
        ): Nat64 {
            config.getAsNat64(key);
        };

        public func configGetAsInt(
            key: Text
        ): Int {
            config.getAsInt(key);
        };

        public func rewardUser(
            principal: Principal,
            value: Nat64, 
            this: actor {}
        ): async Result.Result<(), Text> {
            try {
                switch(await mmt.transfer(
                    principal,
                    Nat64.toNat(value))
                ) {
                    case (#Err(e)) {
                        ignore logger.err(this, "DaoService.rewardUser(" # debug_show(principal) # "):" # debug_show(e));
                        #err(debug_show(e));
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            catch(e) {
                ignore logger.err(this, "DaoService.rewardUser(" # debug_show(principal) # "):" # Error.message(e));
                #err(Error.message(e));
            };
        };

        public func balanceOf(
            caller: UserTypes.Profile
        ): async Nat {
            await mmt.balanceOf(Principal.fromText(caller.principal));
        };

        public func stake(
            value: Nat,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<(), Text> {
            try {
                let fee = await mmt.getTokenFee();
                if(value <= fee) {
                    return #err("Value too low");
                };
            
                let allowed = await mmt.allowance(invoker, Principal.fromActor(this));
                
                if(allowed < value + fee) {
                    return #err("Insufficient allowance");
                };

                let cur = switch(staked.get(invoker)) {
                    case null 0;
                    case (?value) value;
                };
                
                switch(await mmt.transferFrom(invoker, Principal.fromActor(this), value)) {
                    case (#Err(msg)) {
                        return #err(debug_show(msg));
                    };
                    case _ {
                    };
                };

                staked.put(invoker, cur + value);

                #ok();
            }
            catch(e) {
                ignore logger.err(this, "DaoService.stake(" # debug_show(invoker) # "):" # Error.message(e));
                #err(Error.message(e));
            };
        };

        public func unstake(
            value: Nat,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<(), Text> {
            try {
                let fee = await mmt.getTokenFee();
                if(value == 0) {
                    return #err("Value too low");
                };

                let cur = switch(staked.get(invoker)) {
                    case null 0;
                    case (?value) value;
                };

                if(cur < value) {
                    return #err("Insufficient staked balance");
                };

                staked.put(invoker, cur - value);

                switch(await mmt.transfer(invoker, value)) {
                    case (#Err(msg)) {
                        staked.put(invoker, cur);
                        return #err(debug_show(msg));
                    };
                    case _ {
                    };
                };

                #ok();
            }
            catch(e) {
                ignore logger.err(this, "DaoService.unstake(" # debug_show(invoker) # "):" # Error.message(e));
                #err(Error.message(e));
            };
        };

        public func punishStaker(
            principal: Principal,
            value: Nat
        ): Result.Result<(), Text> {
            let cur = switch(staked.get(principal)) {
                case null 0;
                case (?value) value;
            };

            if(cur < value) {
                return #err("Insufficient staked balance");
            };

            staked.put(principal, cur - value);

            #ok();
        };

        public func stakedBalanceOf(
            invoker: Principal
        ): Nat {
            switch(staked.get(invoker)) {
                case null 0;
                case (?value) value;
            };
        };

        public func deposit(
            value: Nat,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<(), Text> {
            try {
                let fee = await mmt.getTokenFee();
                if(value <= fee) {
                    return #err("Value too low");
                };
            
                let allowed = await mmt.allowance(invoker, Principal.fromActor(this));
                
                if(allowed < value + fee) {
                    return #err("Insufficient allowance");
                };

                let cur = switch(deposited.get(invoker)) {
                    case null 0;
                    case (?value) value;
                };
                
                switch(await mmt.transferFrom(invoker, Principal.fromActor(this), value)) {
                    case (#Err(msg)) {
                        return #err(debug_show(msg));
                    };
                    case _ {
                    };
                };

                deposited.put(invoker, cur + value);

                #ok();
            }
            catch(e) {
                ignore logger.err(this, "DaoService.deposit(" # debug_show(invoker) # "):" # Error.message(e));
                #err(Error.message(e));
            };
        };

        public func reimburse(
            value: Nat,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<(), Text> {
            try {
                let fee = await mmt.getTokenFee();
                if(value == 0) {
                    return #err("Value too low");
                };

                let cur = switch(deposited.get(invoker)) {
                    case null 0;
                    case (?value) value;
                };

                if(cur < value) {
                    return #err("Insufficient deposited balance");
                };

                deposited.put(invoker, cur - value);

                switch(await mmt.transfer(invoker, value)) {
                    case (#Err(msg)) {
                        deposited.put(invoker, cur);
                        return #err(debug_show(msg));
                    };
                    case _ {
                    };
                };

                #ok();
            }
            catch(e) {
                ignore logger.err(this, "DaoService.reimburse(" # debug_show(invoker) # "):" # Error.message(e));
                #err(Error.message(e));
            };
        };

        public func punishDepositor(
            principal: Principal,
            value: Nat
        ): Result.Result<(), Text> {
            let cur = switch(deposited.get(principal)) {
                case null 0;
                case (?value) value;
            };

            if(cur < value) {
                return #err("Insufficient deposited balance");
            };

            deposited.put(principal, cur - value);

            #ok();
        };

        public func depositedBalanceOf(
            invoker: Principal
        ): Nat {
            switch(deposited.get(invoker)) {
                case null 0;
                case (?value) value;
            };
        };

        public func backup(
        ): Types.BackupEntity {
            let conf = Buffer.Buffer<(Text, Variant.Variant)>(config.vars.size());
            for(entry in config.vars.entries()) {
                conf.add(entry);
            };

            let _staked = Buffer.Buffer<(Principal, Nat)>(staked.size());
            for(entry in staked.entries()) {
                _staked.add(entry);
            };

            let _deposited = Buffer.Buffer<(Principal, Nat)>(deposited.size());
            for(entry in deposited.entries()) {
                _deposited.add(entry);
            };
            
            {
                config = Buffer.toArray(conf);
                staked = Buffer.toArray(_staked);
                deposited = Buffer.toArray(_deposited);
            };
        };

        public func restore(
            e: Types.BackupEntity
        ) {
            for(entry in e.config.vals()) {
                config.vars.put(entry.0, entry.1);
            };
            for(entry in e.staked.vals()) {
                staked.put(entry.0, entry.1);
            };
            for(entry in e.deposited.vals()) {
                deposited.put(entry.0, entry.1);
            };
        };
    };
};