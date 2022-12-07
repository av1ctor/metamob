import Result "mo:base/Result";

module {
    public type Method = {
        #send;
    };

    public type Callback = {
        act: Principal;
        method: Text;
        args: Blob;
    };

    public type Address = {
        name: ?Text; 
        email: Text;
    };

    public type Content = {
        #templateId: Nat32;
        #body: Text;
    };

    public type Param = (name: Text, value: Text);

    public type SendRequest = {
        sender: Address;
        to: [Address];
        subject: ?Text;
        content: Content;
        params: [Param];
    };

    public type Item = {
        id: Text;
        req: SendRequest;
        expiresAt: Int;
        attempts: Nat8;
        callback: ?Callback;
    };

    public type Interface = actor {
        getCost: query (method: Method) -> async Nat;
        send: (req: SendRequest, callback: ?Callback) -> async Result.Result<(), Text>;
    };
};