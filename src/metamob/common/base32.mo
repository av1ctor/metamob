// Ported from https://github.com/mmcloughlin/geohash, Released under MIT License

import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";

module {
    public class Base32(
    ) {
        let alphabet: [Char] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']; // geohash
        
        public func encode(
            x: Nat64
        ): [Char] {
            let b: [var Char] = Array.tabulateVar<Char>(12, func (i: Nat): Char = ' ');
            var vx = x;
            var i = 0;
            while(i < 12) {
                b[11-i] := alphabet[Nat64.toNat(vx & 0x1f)];
                vx >>= 5;
                i += 1;
            };
            Array.freeze(b);
        };
    };
};