import Result "mo:base/Result";

module {
    public type SizedBlob = {
        size: Nat32;
        blob: Blob;
    };

    public type StoredFile = {
        data: SizedBlob;
        date: Int64;
    };

    public type FileInfo = {
        offset: Nat64;
        contentType: Text;
    };

    public type Interface = actor {
        create: (contentType: Text, data: Blob) -> async Result.Result<Text, Text>;
        update: (id: Text, contentType: Text, data: Blob) -> async Result.Result<(), Text>;
        delete: (id: Text) -> async Result.Result<(), Text>;
    };
};