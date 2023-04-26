import Array "mo:base/Array";
import Deque "mo:base/Deque";
import Blob "mo:base/Blob";
import Iter "mo:base/Iter";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Int "mo:base/Int";
import Nat8 "mo:base/Nat8";
import Hash "mo:base/Hash";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import TrieMap "mo:base/TrieMap";
import TrieSet "mo:base/TrieSet";
import Text "mo:base/Text";
import ExCycles "mo:base/ExperimentalCycles";
import JSON "mo:json/JSON";
import IC "./IC";
import Utils "utils";
import Random "random";
import ULID "ulid";
import Types "./types";
import Nat64 "mo:base/Nat64";

shared(owner) actor class Emailer(
    host: Text,
    apiKey: Text,
    _custodians: [Principal]
) = this {

    let ONE_MINUTE: Int = 1 * 60 * 1000_000_000; // 1 minute
    let HEARTBEAT_INTERVAL: Nat = 60 * 1000_000_000; // 1 minute
    let MAX_RESPONSE_BYTES: Nat64 = 1024;
    let MAX_ATTEMPTS: Nat8 = 1;
    let ulid = ULID.ULID(Random.Xoshiro256ss(Utils.genRandomSeed("emails")));
    
    stable let custodians: TrieSet.Set<Principal> = TrieSet.fromArray<Principal>(_custodians, Principal.hash, Principal.equal);
    stable var queue = Deque.empty<Types.Item>();
    let maxQueueTime: Int = ONE_MINUTE * 10;

    let ic: IC.IC = actor ("aaaaa-aa");

    func _calcCost(
        method: Types.Method
    ): Nat {
        switch(method) {
            case (#send) {
                2_000_000_000
            };
        };
    };

    public query func getCost(
        method: Types.Method
    ): async Nat {
        _calcCost(method);
    };
    
    public shared(msg) func send(
        req: Types.SendRequest,
        callback: ?Types.Callback
    ): async Result.Result<(), Text> {
        assert _isCustodian(msg.caller);
        
        let cost = _calcCost(#send);
        assert ExCycles.available() >= cost;
        ignore ExCycles.accept(cost);

        queue := Deque.pushBack<Types.Item>(queue, {
            id = ulid.next();
            req = req;
            expiresAt = Time.now() + maxQueueTime;
            attempts = 0;
            callback = callback;
        });

        #ok();
    };

    public query func transformResponse(
        raw : IC.TransformArgs
    ): async IC.CanisterHttpResponse {
        let res : IC.CanisterHttpResponse = {
            status = raw.response.status;
            body = raw.response.body;
            headers = [];
        };
        res;
    };

    func _encodeRequest(
        item: Types.Item
    ): [Nat8] {
        let req = item.req;

        let body = #Object([
            ("sender", #Object([
                ("email", #String(req.sender.email))
            ])),
            ("to", #Array(
                Array.map<Types.Address, JSON.JSON>(req.to, func(to: Types.Address): JSON.JSON {
                    #Object([("email", #String(to.email))])
                })
            )),
            ("headers", #Object([
                ("idempotencyKey", #String(Utils.toLower(item.id)))
            ])),
            switch(req.content) {
                case (#templateId(id)) {
                    ("templateId", #Number(Nat32.toNat(id)));
                };
                case (#body(body)) {
                    ("htmlContent", #String(body));
                };
            },            
            ("params", #Object(
                Array.map<Types.Param, (Text, JSON.JSON)>(req.params, func(param: Types.Param): (Text, JSON.JSON) {
                    (param.0, #String(param.1))
                })
            )),
        ]);

        Blob.toArray(Text.encodeUtf8(JSON.show(body)));
    };

    func _decodeResponse(
        res: IC.CanisterHttpResponse
    ): Text {
        switch(Text.decodeUtf8(Blob.fromArray(res.body))) {
            case null "Error: response body could not be decoded from UTF-8";
            case (?body) {
                body;
            };
        };
    };

    func _send(
        item: Types.Item
    ): async* Bool {
        let headers = [
            {name = "Host"; value = host},
            {name = "User-Agent"; value = "IC emailer"},
            {name = "Accept"; value = "application/json"},
            {name = "Content-Type"; value = "application/json";},
            {name = "api-key"; value = apiKey},
        ];

        let transform_context : IC.TransformContext = {
            function = transformResponse;
            context = Blob.fromArray([]);
        };

        let url = "https://" # host # "/v3/smtp/email";

        let request: IC.CanisterHttpRequestArgs = {
            url = url;
            max_response_bytes = ?MAX_RESPONSE_BYTES;
            headers = headers;
            body = ?_encodeRequest(item);
            method = #post;
            transform = ?transform_context;
        };

        try {
            ExCycles.add(_calcCost(#send));
            let response = await ic.http_request(request);
            let body = _decodeResponse(response);
            if(response.status < 200 or response.status > 299) {
                Debug.print("emailer.send(" # item.id # ") failed: " # body);
                return false;
            };
            Debug.print("emailer.send(" # item.id # ") succeeded: " # body);
            true;
        } catch (err) {
            Debug.print("emailer.send(" # item.id # ") failed: " # Error.message(err));
            false;
        };
    };

    //
    // processing
    //
    func _process(
    ): async* () {
        let now = Time.now();
        label L while(true) {
            switch(Deque.popFront(queue)){
                case (?res) {
                    queue := res.1;
                    let item = res.0;
                    if(item.expiresAt <= now) {
                        Debug.print("emailer.process(): item expired");
                    }
                    else {
                        if(await* _send(item)) {
                            Debug.print("emailer.process(): email sent");
                            switch(item.callback) {
                                case (?cb) {
                                    try {
                                        ignore ic.call(cb.act, cb.method, cb.args);
                                    }
                                    catch(error: Error) {
                                        Debug.print("emailer.process(): Call to " # Principal.toText(cb.act) # "." # cb.method # "() failed: " # Error.message(error));
                                    };
                                };
                                case null {
                                };
                            };
                        }
                        else {
                            if(item.attempts < MAX_ATTEMPTS - 1) {
                                queue := Deque.pushBack<Types.Item>(queue, {
                                    item
                                    with
                                    attempts = item.attempts + 1;
                                });
                            }
                        };
                    };
                };
                case null {
                    break L;
                };
            };
        };
    };

    func _isCustodian(
        caller: Principal
    ): Bool {
        TrieSet.mem<Principal>(custodians, caller, Principal.hash(caller), Principal.equal);
    };

    system func timer(
        setGlobalTimer : Nat64 -> ()
    ) : async () {
        Debug.print("emailer.heartbeat(): Verifying...");
        try {
            await* _process();
        }
        catch(e) {
            Debug.print("emailer.heartbeat() exception: " # Error.message(e));
        };

        setGlobalTimer(Nat64.fromIntWrap(Time.now() + HEARTBEAT_INTERVAL));
    };

    //
    // migrations
    //
    system func preupgrade() {
    };

    system func postupgrade() {
    };
};

