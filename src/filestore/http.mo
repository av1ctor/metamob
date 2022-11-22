import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Nat8 "mo:base/Nat8";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Blob "mo:base/Blob";
import CertifiedData "mo:base/CertifiedData";
import SHA256 "mo:sha256/SHA256";

module {
    public type Token = {
        id: Text;
        offset: Nat64;
    };

    public let STREAM_LIMIT: Nat64 = 2097152; // 2MB

    public type StreamingCallbackHttpResponse = {
        body: Blob;
        token: ?Token;
    };

    public type CallbackStrategy = {
        callback: shared query (Token) -> async StreamingCallbackHttpResponse;
        token: Token;
    };

    public type StreamingStrategy =  {
        #Callback: CallbackStrategy;
    };

    public type HeaderField = (Text, Text);

    public type HttpResponse = {
        status_code: Nat16;
        headers: [HeaderField];
        body: Blob;
        streaming_strategy: ?StreamingStrategy;
        upgrade: ?Bool;
    };

    public type HttpRequest = {
        method: Text;
        url: Text;
        headers: [HeaderField];
        body: Blob;
    };

    type Hash = Blob;
    type Key = Blob;
    type Value = Blob;
    type HashTree = {
        #empty;
        #pruned : Hash;
        #fork : (HashTree, HashTree);
        #labeled : (Key, HashTree);
        #leaf : Value;
    };

    func _assetTree(
        data: Blob
    ): HashTree {
        #labeled ("http_assets",
            #labeled ("/",
                #leaf (_h(data))
            )
        );
    };

    func _updateAssetHash(
        data: Blob
    ) {
        CertifiedData.set(_hashTree(_assetTree(data)));
    };

    public func getCertificate(
        body: Blob
    ): Text {
        let cert = switch (CertifiedData.getCertificate()) {
            case (?c) c;
            case null {
                "getCertificate failed. Call this as a query call!" : Blob
            }
        };

        return "certificate=:" # _base64(cert) # ":, " #
            "tree=:" # _base64(_cborTree(_assetTree(body))) # ":";
    };

    public func getContentTypeFromFileName(
        fileName: Text
    ): Text {
        let tokens = Array.reverse(Iter.toArray(Text.tokens(fileName, #text("."))));
        switch(if(tokens.size() > 0) tokens[0] else "") {
            case "gif" return "image/gif";
            case "jpeg" return "image/jpeg";
            case "png" return "image/png";
            case "svg" return "image/svg+xml";
            case "pdf" return "application/pdf";
            case "doc" return "application/msword";
            case "mp3" return "audio/mp3";
            case "mp4" return "video/mp4";
            case "txt" return "text/plain";
            case "ppt" return "application/vnd.ms-powerpoint";
            case "css" return "text/css";
            case _ "text/html; charset=utf-8";
        };
    };

    func _h(b1 : Blob) : Blob {
        let d = SHA256.Digest();
        d.write(Blob.toArray(b1));
        Blob.fromArray(d.sum());
    };

    func _h2(b1 : Blob, b2 : Blob) : Blob {
        let d = SHA256.Digest();
        d.write(Blob.toArray(b1));
        d.write(Blob.toArray(b2));
        Blob.fromArray(d.sum());
    };

    func _h3(b1 : Blob, b2 : Blob, b3 : Blob) : Blob {
        let d = SHA256.Digest();
        d.write(Blob.toArray(b1));
        d.write(Blob.toArray(b2));
        d.write(Blob.toArray(b3));
        Blob.fromArray(d.sum());
    };

    func _hashTree(
        t: HashTree
    ): Hash {
        switch (t) {
            case (#empty) {
                _h("\11ic-hashtree-empty");
            };
            case (#fork(t1,t2)) {
                _h3("\10ic-hashtree-fork", _hashTree(t1), _hashTree(t2));
            };
            case (#labeled(l,t)) {
                _h3("\13ic-hashtree-labeled", l, _hashTree(t));
            };
            case (#leaf(v)) {
                _h2("\10ic-hashtree-leaf", v)
            };
            case (#pruned(h)) {
                h
            }
        }
    };

    func _base64(
        b: Blob
    ): Text {
        let base64_chars : [Text] = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9","+","/"];
        let bytes = Blob.toArray(b);
        let pad_len = if (bytes.size() % 3 == 0) { 0 } else {3 - bytes.size() % 3 : Nat};
        let padded_bytes = Array.append(bytes, Array.tabulate<Nat8>(pad_len, func(_) { 0 }));
        var out = "";
        for (j in Iter.range(1,padded_bytes.size() / 3)) {
        let i = j - 1 : Nat; // annoying inclusive upper bound in Iter.range
        let b1 = padded_bytes[3*i];
        let b2 = padded_bytes[3*i+1];
        let b3 = padded_bytes[3*i+2];
        let c1 = (b1 >> 2          ) & 63;
        let c2 = (b1 << 4 | b2 >> 4) & 63;
        let c3 = (b2 << 2 | b3 >> 6) & 63;
        let c4 = (b3               ) & 63;
        out #= base64_chars[Nat8.toNat(c1)]
            # base64_chars[Nat8.toNat(c2)]
            # (if (3*i+1 >= bytes.size()) { "=" } else { base64_chars[Nat8.toNat(c3)] })
            # (if (3*i+2 >= bytes.size()) { "=" } else { base64_chars[Nat8.toNat(c4)] });
        };
        return out
    };

    func _cborTree(
        tree: HashTree
    ): Blob {
        let buf = Buffer.Buffer<Nat8>(100);

        // CBOR self-describing tag
        buf.add(0xD9);
        buf.add(0xD9);
        buf.add(0xF7);

        func add_blob(b: Blob) {
        // Only works for blobs with less than 256 bytes
        buf.add(0x58);
        buf.add(Nat8.fromNat(b.size()));
        for (c in Blob.toArray(b).vals()) {
            buf.add(c);
        };
        };

        func go(t : HashTree) {
        switch (t) {
            case (#empty)        { buf.add(0x81); buf.add(0x00); };
            case (#fork(t1,t2))  { buf.add(0x83); buf.add(0x01); go(t1); go (t2); };
            case (#labeled(l,t)) { buf.add(0x83); buf.add(0x02); add_blob(l); go (t); };
            case (#leaf(v))      { buf.add(0x82); buf.add(0x03); add_blob(v); };
            case (#pruned(h))    { buf.add(0x82); buf.add(0x04); add_blob(h); }
        }
        };

        go(tree);

        return Blob.fromArray(Buffer.toArray(buf));
    };
};