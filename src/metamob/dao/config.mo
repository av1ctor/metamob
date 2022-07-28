import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Variant "mo:mo-table/variant";

module {
    public class Config(
    ) {
        public let vars = HashMap.HashMap<Text, Variant.Variant>(10, Text.equal, Text.hash);
        
        public func get(
            key: Text
        ): ?Variant.Variant {
            vars.get(key);
        };

        public func getAsNat32(
            key: Text
        ): Nat32 {
            Variant.getOptNat32(vars.get(key));
        };
        
        public func getAsNat64(
            key: Text
        ): Nat64 {
            Variant.getOptNat64(vars.get(key));
        };

        public func getAsInt(
            key: Text
        ): Int {
            Variant.getOptInt(vars.get(key));
        };
        
        public func set(
            key: Text,
            value: Variant.Variant
        ) {
            vars.put(key, value);
        };
    };
};