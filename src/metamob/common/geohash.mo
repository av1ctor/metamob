// Ported from https://github.com/mmcloughlin/geohash, Released under MIT License

import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Base32 "./base32";
import CharUtils "./charutils";

module {
    public class GeoHash(
    ) {
        let base32 = Base32.Base32();

        public func encode(
            lat: Float,
            lng: Float
        ): Text {
            encodeEx(lat, lng, 12)
        };

        public func encodeEx(
            lat: Float,
            lng: Float,
            chars: Nat64
        ): Text {
            let bits = chars * 5;
            let hash = encodeIntEx(lat, lng, bits);
            let enc = base32.encode(hash);
            CharUtils.toText(CharUtils.substring(enc, Nat64.toNat(12 - chars), 11));
        };

        public func encodeInt(
            lat: Float, 
            lng: Float
        ): Nat64 {
            let latInt = _encodeRange(lat, 90);
            let lngInt = _encodeRange(lng, 180);
            _interleave(latInt, lngInt)
        };

        public func encodeIntEx(
            lat: Float, 
            lng: Float, 
            bits: Nat64
        ): Nat64 {
            let hash = encodeInt(lat, lng);
            hash >> (64 - bits);
        };
        
        func _encodeRange(
            x: Float, 
            r: Float
        ): Nat32 {
            let p = (x + r) / (2 * r);
            Nat32.fromNat(Int.abs(Float.toInt(p * Float.fromInt(4_294_967_296))))
        };

        func _spread(
            x: Nat32
        ): Nat64 {
            var X = Nat64.fromNat(Nat32.toNat(x));
            X := (X | (X << 16)) & 0x0000ffff0000ffff;
            X := (X | (X << 8)) & 0x00ff00ff00ff00ff;
            X := (X | (X << 4)) & 0x0f0f0f0f0f0f0f0f;
            X := (X | (X << 2)) & 0x3333333333333333;
            X := (X | (X << 1)) & 0x5555555555555555;
            X
        };

        func _interleave(
            x: Nat32, 
            y: Nat32
        ): Nat64 {
            _spread(x) | (_spread(y) << 1)
        };
    };
};