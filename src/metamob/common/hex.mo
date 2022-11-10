import Nat8 "mo:base/Nat8";
import Char "mo:base/Char";
import Array "mo:base/Array";

module {
    let hexTb = [
        '0', '1', '2', '3', '4', '5', '6', '7',
        '8', '9', 'a', 'b', 'c', 'd', 'e', 'f',
    ];

    public func encode(
        src: [Nat8]
    ): Text {
        Array.foldLeft<Nat8, Text>(
            src, 
            "", 
            func (acc, byte) = acc # nat8ToHex(byte)
        );
    };
    
    func nat8ToHex(
        byte: Nat8
    ): Text {
        let char1 = hexTb[Nat8.toNat(byte >> 4)];
        let char2 = hexTb[Nat8.toNat(byte & 0x0f)];
        Char.toText(char1) # Char.toText(char2);
  };
};