import Result "mo:base/Result";

module {
    public type Interface = actor {
        create: (contentType: Text, data: Blob) -> async Result.Result<Text, Text>;
        update: (id: Text, contentType: Text, data: Blob) -> async Result.Result<(), Text>;
        delete: (id: Text) -> async Result.Result<(), Text>;
    };
};