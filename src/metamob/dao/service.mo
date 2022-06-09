import Nat64 "mo:base/Nat64";
import Buffer "mo:base/Buffer";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Error "mo:base/Error";
import D "mo:base/Debug";
import Variant "mo:mo-table/variant";
import DIP20 "../common/dip20";
import UserTypes "../users/types";
import Config "./config";

module {
    public class Service(
        mmtCanisterId: Text
    ) {
        public let config = Config.Config();
        public let mmt = actor (mmtCanisterId) : DIP20.Interface;
        
        // default values
        config.set("REPORT_REWARD", #nat64(100000000)); // 1 MMT

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

        public func rewardUser(
            caller: UserTypes.Profile,
            value: Nat64
        ): async Result.Result<(), Text> {
            try {
                switch(await mmt.transfer(
                    Principal.fromText(caller.principal),
                    Nat64.toNat(value))
                ) {
                    case (#Err(e)) {
                        D.print("Error: daoService.rewardUser(" # caller.principal # "):" # debug_show(e));
                        #err(debug_show(e));
                    };
                    case _ {
                        #ok();
                    };
                };
            }
            catch(e) {
                D.print("Error: daoService.rewardUser(" # caller.principal # "):" # Error.message(e));
                #err(Error.message(e));
            };
        };

        public func backup(
        ): [(Text, Variant.Variant)] {
            let buff = Buffer.Buffer<(Text, Variant.Variant)>(config.vars.size());
            for(entry in config.vars.entries()) {
                buff.add(entry);
            };
            buff.toArray();
        };

        public func restore(
            arr: [(Text, Variant.Variant)]
        ) {
            for(entry in arr.vals()) {
                config.vars.put(entry.0, entry.1);
            };
        };
    };
};