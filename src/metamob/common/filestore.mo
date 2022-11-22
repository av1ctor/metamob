import Iter "mo:base/Iter";
import Text "mo:base/Text";
import TrieSet "mo:base/TrieSet";
import Result "mo:base/Result";
import FileStore "../interfaces/filestore";
import D "mo:base/Debug";

module FileStoreHelper {
    public type FileRequest = {
        contentType: Text;
        data: Blob;
    };

    public class FileStoreHelper(
        canisterId: Text,
        maxFileSize: Nat,
        validContentTypes: [Text]
    ) {
        let fs = actor (canisterId) : FileStore.Interface;
        let contentTypes = TrieSet.fromArray<Text>(validContentTypes, Text.hash, Text.equal);
        
        public func create(
            file: FileRequest
        ): async Result.Result<Text, Text> {
            await fs.create(file.contentType, file.data);
        };

        public func update(
            id: Text,
            file: FileRequest
        ): async Result.Result<(), Text> {
            await fs.update(id, file.contentType, file.data);
        };

        public func delete(
            id: Text
        ): async Result.Result<(), Text> {
            await fs.delete(id);
        };

        public func checkFileRequest(
            file: FileRequest
        ): Result.Result<(), Text> {
            if(file.data.size() == 0) {
                return #err("File can't be empty");
            };
            
            if(file.data.size() > maxFileSize) {
                return #err("File too big");
            };

            if(not TrieSet.mem<Text>(contentTypes, file.contentType, Text.hash(file.contentType), Text.equal)) {
                return #err("Invalid type");
            };

            #ok();
        };

        public func isId(
            value: Text
        ): Bool {
            let tokens = Iter.toArray(Text.tokens(value, #text("/")));
            tokens.size() == 0;
        };
    };
};