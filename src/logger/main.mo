import TrieSet "mo:base/TrieSet";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Int64 "mo:base/Int64";
import SM "mo:base/ExperimentalStableMemory";
import List "mo:base/List";
import Time "mo:base/Time";
import Salloc "./salloc";
import Types "./types";
import D "mo:base/Debug";

shared(creator) actor class Logger(
    _custodians: [Principal]
) = this {

    type SizedBlob = {
        size: Nat32;
        blob: Blob;
    };

    type StoredMsg = {
        kind: Types.MsgKind;
        act: SizedBlob;
        msg: SizedBlob;
        date: Int64;
    };

    type MsgNode = {
        offset: Nat64;
    };

    stable let custodians: TrieSet.Set<Principal> = TrieSet.fromArray<Principal>(_custodians, Principal.hash, Principal.equal);
    stable var msgList: List.List<MsgNode> = List.nil<MsgNode>();
    let salloc = Salloc.Salloc();
    
    public query func find(
        offset: Nat32,
        size: Nat32
    ): async [Types.Msg] {
        let res = Buffer.Buffer<Types.Msg>(Nat32.toNat(size));
        var nodes = List.take(List.drop(msgList, Nat32.toNat(offset)), Nat32.toNat(size));
        for(node in List.toIter(nodes)) {
            let msg = _loadMsg(node.offset);
            res.add(msg);
        };

        return Buffer.toArray(res);
    };
    
    public shared(msg) func err(
        act: actor {},
        text: Text
    ): async () {
        if(not _isCustodian(msg.caller)) {
            D.print("Forbidden");
            return;
        };
        ignore _storeMsg(Types.MSG_KIND_ERROR, act, text);
    };

    public shared(msg) func warn(
        act: actor {},
        text: Text
    ): async () {
        if(not _isCustodian(msg.caller)) {
            D.print("Forbidden");
            return;
        };
        ignore _storeMsg(Types.MSG_KIND_WARN, act, text);
    };

    public shared(msg) func info(
        act: actor {},
        text: Text
    ): async () {
        if(not _isCustodian(msg.caller)) {
            D.print("Forbidden");
            return;
        };
        ignore _storeMsg(Types.MSG_KIND_INFO, act, text);
    };

    func _isCustodian(
        caller: Principal
    ): Bool {
        TrieSet.mem<Principal>(custodians, caller, Principal.hash(caller), Principal.equal);
    };

    func _storeMsg(
        kind: Types.MsgKind,
        act: actor {},
        msg: Text
    ): Result.Result<(), Text> {
        let blobActor = Principal.toBlob(Principal.fromActor(act));
        let blobMsg = Text.encodeUtf8(msg);

        let sm: StoredMsg = {
            kind = kind;
            act = {
                size = Nat32.fromNat(blobActor.size());
                blob = blobActor;
            };
            msg = {
                size = Nat32.fromNat(blobMsg.size());
                blob = blobMsg;
            };
            date = Int64.fromInt(Time.now());
        };

        switch(salloc.alloc(Nat64.fromNat(Nat32.toNat(1 + 4 + sm.act.size + 4 + sm.msg.size + 8)))) {
            case (#ok(offset)) {
                var ofs = offset;
                // kind
                SM.storeNat8(ofs, sm.kind);
                ofs += 1;
                // act.size
                SM.storeNat32(ofs, sm.act.size);
                ofs += 4;
                // act.blob
                SM.storeBlob(ofs, sm.act.blob);
                ofs += Nat64.fromNat(Nat32.toNat(sm.act.size));
                // msg.size
                SM.storeNat32(ofs, sm.msg.size);
                ofs += 4;
                // msg.blob
                SM.storeBlob(ofs, sm.msg.blob);
                ofs += Nat64.fromNat(Nat32.toNat(sm.msg.size));
                // date
                SM.storeInt64(ofs, sm.date);
                
                msgList := List.push(
                    {
                        offset = offset;
                    }, 
                    msgList
                );

                #ok();
            };
            case (#err(msg)) {
                #err(msg);
            };
        };
    };

    func _loadMsg(
        offset: Nat64
    ): Types.Msg {
        var ofs = offset;
        // kind
        let kind = SM.loadNat8(ofs);
        ofs += 1;
        // act.size
        let sizeAct = Nat32.toNat(SM.loadNat32(ofs));
        ofs += 4;
        // act.blob
        let blobAct = SM.loadBlob(ofs, sizeAct);
        ofs += Nat64.fromNat(sizeAct);
        // msg.size
        let sizeMsg = Nat32.toNat(SM.loadNat32(ofs));
        ofs += 4;
        // msg.blob
        let blobMsg = SM.loadBlob(ofs, sizeMsg);
        ofs += Nat64.fromNat(sizeMsg);
        // date
        let date = SM.loadInt64(ofs);
        ofs += 8;
        
        return {
            kind = kind;
            act = Principal.fromBlob(blobAct);
            msg = switch(Text.decodeUtf8(blobMsg)) {case (?text) text; case null ""};
            date = Int64.toInt(date);
        };
    };

    stable var sallocState: ?Salloc.State = null;
    
    system func preupgrade() {
        sallocState := ?salloc.backup();
    };

    system func postupgrade() {
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