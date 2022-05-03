module {
    public type Comment = {
        _id: Nat32;
        pubId: Text;
        body: Text;
        petitionId: Nat32;
        likes: Nat32;
        dislikes: Nat32;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type CommentRequest = {
        petitionId: Nat32;
        body: Text;
    };
};