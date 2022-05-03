import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Array "mo:base/Array";

module {
    // adapted from https://en.wikipedia.org/wiki/Xorshift
    public class Xoshiro256ss(
        seed: Nat64
    ) {
        private func init (
            seed: Nat64
        ): [var Nat64] {
            let tmp1 = splitmix64(seed);
            let tmp2 = splitmix64(tmp1.1);
            let tmp3 = splitmix64(tmp2.1);
            let tmp4 = splitmix64(tmp3.1);
            
            return [var tmp1.0, tmp2.0, tmp3.0, tmp4.0];
        };
        
        private let state: [var Nat64] = init(seed);
        
        public func next(
        ): Nat64 {
            let result = state[0] +% state[3];
            let t = state[1] << 17;

            state[2] ^= state[0];
            state[3] ^= state[1];
            state[1] ^= state[2];
            state[0] ^= state[3];

            state[2] ^= t;
            state[3] := (state[3] >> 45) | (state[3] << (64 - 45));

            return result;
        };
    };

    private func splitmix64(state: Nat64): (Nat64, Nat64) {
        let s = state +% 0x9E3779B97f4A7C15;
        var result = s;
        result := (result ^ (result >> 30)) *% 0xBF58476D1CE4E5B9;
        result := (result ^ (result >> 27)) *% 0x94D049BB133111EB;
        return (result ^ (result >> 31), s);
    };
};