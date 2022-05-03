module {
    public type Petition = {
        _id: Nat32;
        pubId: Text;
        title: Text;
        body: Text;
        categoryId: Nat32;
        stick: Bool;
        global: Bool;
        locked: Bool;
        tags: [Nat32];
        likes: Nat32;
        dislikes: Nat32;
        commentsCnt: Nat32;
        firstCommentAt: ?Int;
        lastCommentAt: ?Int;
        lastCommentBy: ?Nat32;
        commenters: [Nat32];
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
        deletedAt: ?Int;
        deletedBy: ?Nat32;
    };

    public type PetitionRequest = {
        title: Text;
        body: Text;
        categoryId: Nat32;
        tags: [Nat32];
    };
};