import Prim "mo:prim";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Time "mo:base/Time";

module {
    public func genRandomSeed(
        owner: Text
    ): Nat64 {
        (Nat64.fromNat(Nat32.toNat(Text.hash(owner))) << 32) | Nat64.fromIntWrap(Time.now())
    };

    public func toLower(s: Text): Text {
        Text.map(s, Prim.charToLower);
    };
};