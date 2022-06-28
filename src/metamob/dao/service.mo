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

module {
    public class Service(
        mmtCanisterId: Text
    ) {
        public let config = Config.Config();
        public let mmt = actor (mmtCanisterId) : DIP20.Interface;
        let staked = HashMap.HashMap<Principal, Nat>(100, Principal.equal, Principal.hash);
        
        // default values
        config.set("REPORTER_REWARD", #nat64(100000000)); // 1 MMT
        config.set("MODERATOR_MIN_STAKE", #nat64(100000000000)); // 1000 MMT
        config.set("MODERATOR_REWARD", #nat64(1000000000)); // 10 MMT

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

        public func rewardUser(
            principal: Principal,
            value: Nat64
        ): async Result.Result<(), Text> {
            try {
                switch(await mmt.transfer(
                    principal,
                    Nat64.toNat(value))
                ) {
                    case (#Err(e)) {
                        D.print("Error: daoService.rewardUser(" # debug_show(principal) # "):" # debug_show(e));
                        #err(debug_show(e));
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            catch(e) {
                D.print("Error: daoService.rewardUser(" # debug_show(principal) # "):" # Error.message(e));
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
                D.print("Error: daoService.stake(" # debug_show(invoker) # "):" # Error.message(e));
                #err(Error.message(e));
            };
        };

        public func withdraw(
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
                D.print("Error: daoService.withdraw(" # debug_show(invoker) # "):" # Error.message(e));
                #err(Error.message(e));
            };
        };

        public func stakedBalanceOf(
            invoker: Principal
        ): Nat {
            switch(staked.get(invoker)) {
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

            let stkd = Buffer.Buffer<(Principal, Nat)>(staked.size());
            for(entry in staked.entries()) {
                stkd.add(entry);
            };
            
            {
                config = conf.toArray();
                staked = stkd.toArray();
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
        };
    };
};