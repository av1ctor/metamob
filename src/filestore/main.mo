import Array "mo:base/Array";
import Principal "mo:base/Principal";
import TrieSet "mo:base/TrieSet";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Time "mo:base/Time";
import Int64 "mo:base/Int64";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Result "mo:base/Result";
import TrieMap "mo:base/TrieMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import List "mo:base/List";
import SM "mo:base/ExperimentalStableMemory";
import Utils "utils";
import Random "random";
import Salloc "salloc";
import ULID "ulid";
import HTTP "http";
import Types "types";

shared(creator) actor class FileStore(
    _custodians: [Principal],
    _origins: [Text]
) = this {

    stable let custodians: TrieSet.Set<Principal> = TrieSet.fromArray<Principal>(_custodians, Principal.hash, Principal.equal);
    stable let origins: TrieSet.Set<Text> = TrieSet.fromArray<Text>(_origins, Text.hash, Text.equal);
    let files: TrieMap.TrieMap<Text, Types.FileInfo> = TrieMap.TrieMap<Text, Types.FileInfo>(Text.equal, Text.hash);
    let salloc = Salloc.Salloc();
    let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("files")));

    public shared(msg) func create(
        contentType: Text,
        data: Blob,
    ): async Result.Result<Text, Text> {
        if(not _isCustodian(msg.caller)) {
            return #err("Forbidden");
        };
        
        let id = ulid.next();
        switch(_storeFile(id, data)) {
            case (#err(msg)) {
                #err(msg);
            };
            case (#ok(offset)) {
                files.put(
                    id,
                    {
                        offset = offset;
                        contentType = contentType;
                    }, 
                );

                #ok(id);
            };
        };
    };

    public shared(msg) func update(
        id: Text,
        contentType: Text,
        data: Blob,
    ): async Result.Result<(), Text> {
        if(not _isCustodian(msg.caller)) {
            return #err("Forbidden");
        };
        
        switch(files.get(id)) {
            case null {
                return #err("Not found");
            };
            case (?file) {
                
                switch(_storeFile(id, data)) {
                    case (#err(msg)) {
                        #err(msg);
                    };
                    case (#ok(offset)) {
                        ignore files.replace(
                            id,
                            {
                                offset = offset;
                                contentType = contentType;
                            }, 
                        );
                        ignore salloc.free(file.offset);
                        #ok();
                    };
                };
            };
        };
    };

    public shared(msg) func delete(
        id: Text
    ): async Result.Result<(), Text> {
        if(not _isCustodian(msg.caller)) {
            return #err("Forbidden");
        };
        
        switch(files.get(id)) {
            case null {
                return #err("Not found");
            };
            case (?file) {
                ignore salloc.free(file.offset);
                files.delete(id);
                #ok();
            };
        };
    };

    public query func http_request(
        req: HTTP.HttpRequest
    ): async HTTP.HttpResponse {
        switch (req.method) {
            case ("GET") {
                let id = _getFileId(req.url);
                switch(files.get(id)) {
                    case null {
                        return _buildErrorResponse(404, "File id " # id # " not found");
                    };
                    case (?file) {
                        let info = _loadFile(file.offset, 0, HTTP.STREAM_LIMIT);
                        let needsStreaming = Nat64.fromNat(info.data.blob.size()) > HTTP.STREAM_LIMIT;
                        return {
                            status_code = 200;
                            headers = [ 
                                ("content-type", file.contentType), 
                                ("ic-certificate", HTTP.getCertificate(info.data.blob))
                            ];
                            body = info.data.blob;
                            streaming_strategy = 
                                if(needsStreaming)
                                    ?#Callback({
                                        callback = http_streaming;
                                        token = {
                                            id = id;
                                            offset = Nat64.fromNat(info.data.blob.size());
                                        }
                                    })
                                else 
                                    null;
                            upgrade = ?false;
                        };
                    };
                };
            };
            case _ {
                return _buildErrorResponse(400, "Invalid request");
            };
        };
    };

    public query func http_streaming(
        token: HTTP.Token
    ): async HTTP.StreamingCallbackHttpResponse {
        switch(files.get(token.id)) {
            case null {
                {
                    body = Blob.fromArray([]);
                    token = null;
                }
            };
            case (?file) {
                let info = _loadFile(file.offset, token.offset, HTTP.STREAM_LIMIT);
                {
                    body = info.data.blob;
                    token = ?{
                        id = token.id;
                        offset = token.offset + Nat64.fromNat(info.data.blob.size());
                    }
                }
            };
        };
    };

    func _getFileId(
        url: Text
    ): Text {
        let urlWithoutQueryStr = Iter.toArray(Text.tokens(url, #text("?")));
        let path = Iter.toArray(Text.tokens(urlWithoutQueryStr[0], #text("/")));
        if(path.size() == 1) {
            path[0];
        }
        else {
            "";
        };
    };

    func _buildErrorResponse(
        code: Nat16,
        body: Text
    ): HTTP.HttpResponse {
        let blobBody = Text.encodeUtf8(body);
        return {   
            status_code = code;
            headers = [
                ("content-type", "text/plain"),
                ("ic-certificate", HTTP.getCertificate(blobBody))
            ];
            body = blobBody;
            streaming_strategy = null;
            upgrade = null;
        };
    };

    func _isCustodian(
        caller: Principal
    ): Bool {
        TrieSet.mem<Principal>(custodians, caller, Principal.hash(caller), Principal.equal);
    };

    func _storeFile(
        id: Text,
        data: Blob
    ): Result.Result<Nat64, Text> {
        let sf: Types.StoredFile = {
            data = {
                size = Nat32.fromNat(data.size());
                blob = data;
            };
            date = Int64.fromInt(Time.now());
        };

        let size = Nat64.fromNat(data.size());

        switch(salloc.alloc(4 + size + 8)) {
            case (#ok(offset)) {
                var ofs = offset;
                // date
                SM.storeInt64(ofs, sf.date);
                ofs += 8;
                // data.size
                SM.storeNat32(ofs, sf.data.size);
                ofs += 4;
                // data.blob
                SM.storeBlob(ofs, sf.data.blob);
                ofs += size;
                
                #ok(offset);
            };
            case (#err(msg)) {
                #err(msg);
            };
        };
    };

    func _loadFile(
        offset: Nat64,
        skip: Nat64,
        limit: Nat64
    ): Types.StoredFile {
        var ofs = offset;
        // date
        let date = SM.loadInt64(ofs);
        ofs += 8;
        // data.size
        let size = Nat64.fromNat(Nat32.toNat(SM.loadNat32(ofs)));
        ofs += 4;
        // data.blob
        if(skip >= size) {
            return {
                data = {
                    size = Nat32.fromNat(0);
                    blob = Blob.fromArray([]);
                };
                date = date;
            };
        }
        else {
            let rem = size - skip;
            let len = Nat64.toNat(if(limit < rem) limit else rem);
            let data = SM.loadBlob(ofs + skip, len);
            
            return {
                data = {
                    size = Nat32.fromNat(len);
                    blob = data;
                };
                date = date;
            };
        };
    };

    stable var fileEntries: [(Text, Types.FileInfo)] = [];
    stable var sallocState: ?Salloc.State = null;
    
    system func preupgrade() {
        fileEntries := Iter.toArray(files.entries());
        sallocState := ?salloc.backup();
    };

    system func postupgrade() {
        for(e in fileEntries.vals()) {
            files.put(e.0, e.1);
        };
        fileEntries := [];

        switch(sallocState) {
            case (?state) {
                salloc.restore(state);
                sallocState := null;
            };
            case null {
            };
        };
    };
};
