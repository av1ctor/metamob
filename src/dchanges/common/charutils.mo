import Char "mo:base/Char";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import Iter "mo:base/Iter";

module {
    public func fromText(
        text: Text
    ): [Char] {
        Iter.toArray(Text.toIter(text));
    };

    public func toText(
        text: [Char] 
    ): Text {
        Text.fromIter(text.vals());
    };

    public func varToText(
        text: [var Char] 
    ): Text {
        Text.fromIter(text.vals());
    };

    public func substring(
        arr: [Char], 
        start: Nat, 
        end: Nat
    ): [Char] {
        if(start <= end) {
            Array.tabulate(Nat.sub(end, start) + 1, func (i: Nat): Char = arr[start+i]);
        }
        else {
            [];
        };
    };

    public func regionMatches(
        pattern: [Char],
        offset: Nat,
        with: [Char],
        len: Nat
    ): Bool {
        
        var i = 0;
        while(i < len) {
            if(pattern[offset+i] != with[i]) {
                return false;
            };
            i += 1;
        };

        true;
    };

    public func equals(
        a: [Char],
        b: [Char]
    ): Bool {
        if(a.size() != b.size()) {
            return false;
        };

        let len = a.size();
        var i = 0;
        while(i < len) {
            if(a[i] != b[i]) {
                return false;
            };
            i += 1;
        };

        true;
    };

    public func startsWith(
        from: [Char],
        pref: [Char]
    ): Bool {
        if(pref.size() > from.size()) {
            return false;
        };

        let len = pref.size();
        var i = 0;
        while(i < len) {
            if(from[i] != pref[i]) {
                return false;
            };
            i += 1;
        };

        true;
    };

    public func removeFirstChar(
        from: [Char]
    ): [Char] {
        if(from.size() <= 1) {
            [];
        }
        else {
            Array.tabulate(Nat.sub(from.size(), 1), func (i: Nat): Char = from[1+i]);
        };
    };

    public func removeLastChar(
        from: [Char]
    ): [Char] {
        if(from.size() <= 1) {
            [];
        }
        else {
            Array.tabulate(Nat.sub(from.size(), 1), func (i: Nat): Char = from[i]);
        };
    };

    public func getLastChar(
        from: [Char]
    ): Char {
        if(from.size() == 0) {
            ' ';
        }
        else {
            from[from.size() - 1];
        };
    };

    public func appendChar(
        to: [Char],
        char: Char
    ): [Char] {
        Array.append(to, [char]);
    };

    public func toBuffer(
        from: [Char]
    ): Buffer.Buffer<Char> {
        if(from.size() == 0) {
            Buffer.Buffer<Char>(0);
        }
        else {
            Array.foldLeft(
                from, 
                Buffer.Buffer<Char>(from.size()), 
                func (buf: Buffer.Buffer<Char>, char: Char): Buffer.Buffer<Char> {
                    buf.add(char); 
                    buf;
                }
            );
        };
    };
};