/**
 * ULID implementation
 * Copyright 2021 André Vicentini (https://github.com/av1ctor/)
 * Licensed under the Apache license Version 2.0
 * Ported from https://github.com/huxi/sulky/ (Copyright 2007-2011 Joern Huxhorn, Licensed under the Apache license Version 2.0) 
 */

import Nat64 "mo:base/Nat64";
import Int64 "mo:base/Int64";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Random "./random";

module {
    public class ULID(
        random: Random.Xoshiro256ss
    ) {
        private let ENCODING_CHARS: [Char] = [
            '0','1','2','3','4','5','6','7','8','9',
            'A','B','C','D','E','F','G','H','J','K',
            'M','N','P','Q','R','S','T','V','W','X',
            'Y','Z',
        ];

        let MASK: Nat64 = 0x1F;
        let MASK_BITS: Nat64 = 5;

        public func next(
        ): Text {
            let timestamp = Nat64.fromIntWrap(Time.now());
            let buffer = Array.tabulateVar<Char>(26, func(i:Nat): Char {'0'});

            internalWriteCrockford(buffer, timestamp, 10, 0);
            internalWriteCrockford(buffer, random.next(), 8, 10);
            internalWriteCrockford(buffer, random.next(), 8, 18);

            return Text.fromIter(buffer.vals());
        };

        private func internalWriteCrockford(
            buffer: [var Char], 
            value: Nat64, 
            count: Nat64, 
            offset: Nat
        ) {
            for(i in Iter.range(0, Int64.toInt(Int64.fromNat64(count)) - 1))
            {
                let index = Nat64.toNat((value >> ((count - 1 - Nat64.fromNat(i)) *% MASK_BITS)) & MASK);
                buffer[offset+i] := ENCODING_CHARS[index];
            }
        };
    };
};