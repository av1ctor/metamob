// from https://github.com/dfinity/examples - licensed under Apache-2.0 license

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import CRC32 "./CRC32";
import SHA224 "./SHA224";
import Types "./types";

module {
    func beBytes(
        n: Nat32
    ): [Nat8] {
        func byte(n: Nat32) : Nat8 {
            Nat8.fromNat(Nat32.toNat(n & 0xff))
        };
        [byte(n >> 24), byte(n >> 16), byte(n >> 8), byte(n)]
    };

    public func principalToSubaccount(
        principal: Principal
    ): Blob {
        let idHash = SHA224.Digest();
        idHash.write(Blob.toArray(Principal.toBlob(principal)));
        let hashSum = idHash.sum();
        let crc32Bytes = beBytes(CRC32.ofArray(hashSum));
        Blob.fromArray(Array.append(crc32Bytes, hashSum));
    };

    public func textToSubaccount(
        text: Text
    ): Blob {
        let idHash = SHA224.Digest();
        idHash.write(Blob.toArray(Text.encodeUtf8(text)));
        let hashSum = idHash.sum();
        let crc32Bytes = beBytes(CRC32.ofArray(hashSum));
        Blob.fromArray(Array.append(crc32Bytes, hashSum));
    };

    public func defaultSubaccount(
    ): Types.Subaccount {
        Blob.fromArrayMut(Array.init(32, 0 : Nat8))
    };

    public func accountIdentifier(
        principal: Principal, 
        subaccount: Types.Subaccount
    ): Types.AccountIdentifier {
        let hash = SHA224.Digest();
        hash.write([0x0A]);
        hash.write(Blob.toArray(Text.encodeUtf8("account-id")));
        hash.write(Blob.toArray(Principal.toBlob(principal)));
        hash.write(Blob.toArray(subaccount));
        let hashSum = hash.sum();
        let crc32Bytes = beBytes(CRC32.ofArray(hashSum));
        Blob.fromArray(Array.append(crc32Bytes, hashSum))
    };

    public func validateAccountIdentifier(
        accountIdentifier : Types.AccountIdentifier
    ): Bool {
        if (accountIdentifier.size() != 32) {
            return false;
        };
        let a = Blob.toArray(accountIdentifier);
        let accIdPart    = Array.tabulate(28, func(i: Nat): Nat8 { a[i + 4] });
        let checksumPart = Array.tabulate(4,  func(i: Nat): Nat8 { a[i] });
        let crc32 = CRC32.ofArray(accIdPart);
        Array.equal(beBytes(crc32), checksumPart, Nat8.equal)
    };
}