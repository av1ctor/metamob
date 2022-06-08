import Prim "mo:prim";
import Int "mo:base/Int";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Order "mo:base/Order";
import Hash "mo:base/Hash";
import TrieSet "mo:base/TrieSet";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import D "mo:base/Debug";

module {
    public func toLower(s: Text): Text {
        Text.map(s, Prim.charToLower);
    };

    public func order2Int(res: Order.Order): Int {
        switch(res) {
            case (#less) -1;
            case (#equal) 0;
            case (#greater) 1;
        };
    };

    public func compareIntOpt(a: ?Int, b: ?Int): Order.Order {
        switch(a, b) {
            case (null, null) {
                return #equal;
            };
            case (null, _) {
                return #less;
            };
            case (_, null) {
                return #greater;
            };
            case (?a, ?b) {
                return Int.compare(a, b);
            };
        };
    };

    public func dumpNatBuffer(
        buf: Buffer.Buffer<Nat>
    ) {
        D.print(debug_show(buf.toArray()));
    };

    public func dumpTextBuffer(
        buf: Buffer.Buffer<Text>
    ) {
        D.print(debug_show(buf.toArray()));
    };

    public func genRandomSeed(
        owner: Text
    ): Nat64 {
        (Nat64.fromNat(Nat32.toNat(Text.hash(owner))) << 32) | Nat64.fromIntWrap(Time.now())
    };

    public func arrayToBuffer<T>(
        from: [T]
    ): Buffer.Buffer<T> {
        if(from.size() == 0) {
            Buffer.Buffer<T>(0);
        }
        else {
            Array.foldLeft(
                from, 
                Buffer.Buffer<T>(from.size()), 
                func (buf: Buffer.Buffer<T>, elm: T): Buffer.Buffer<T> {
                    buf.add(elm); 
                    buf;
                }
            );
        };
    };

    public func addToArray<T>(
        src: [T], 
        value: T
    ): [T] {
        let buf = arrayToBuffer<T>(src);
        buf.add(value);
        buf.toArray()
    };

    public func delFromArray<T>(
        src: [T], 
        value: T,
        equal: (T, T) -> Bool
    ): [T] {
        var found = false;
        Array.filter<T>(src, func(elm: T): Bool {
            if(not equal(elm, value) or found) {
                return true;
            };
            found := true;
            false;
        })
    };

    public func addToSet<T>(
        src: [T], 
        value: T,
        hash: (T) -> Hash.Hash,
        equal: (T, T) -> Bool
    ): [T] {
        let s = TrieSet.fromArray<T>(src, hash, equal);
        TrieSet.toArray(TrieSet.put<T>(s, value, hash(value), equal));
    };

    public func delFromSet<T>(
        src: [T], 
        value: T,
        hash: (T) -> Hash.Hash,
        equal: (T, T) -> Bool
    ): [T] {
        let s = TrieSet.fromArray<T>(src, hash, equal);
        TrieSet.toArray(TrieSet.delete<T>(s, value, hash(value), equal));
    };
};