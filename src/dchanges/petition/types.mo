module {
    public type PetitionState = Nat8;
    public let STATE_CREATED: Nat8 = 0;
    public let STATE_CANCELED: Nat8 = 1;
    public let STATE_DELETED: Nat8 = 2;
    public let STATE_PUBLISHED: Nat8 = 3;
    public let STATE_FINISHED: Nat8 = 4;
    public let STATE_BANNED: Nat8 = 5;

    public type PetitionResult = Nat8;
    public let RESULT_NONE: Nat8 = 0;
    public let RESULT_WON: Nat8 = 1;
    public let RESULT_LOST: Nat8 = 2;

    public type Petition = {
        _id: Nat32;
        pubId: Text;
        title: Text;
        cover: Text;
        body: Text;
        categoryId: Nat32;
        state: PetitionState;
        result: PetitionResult;
        duration: Nat32;
        tags: [Nat32];
        likes: Nat32;
        dislikes: Nat32;
        commentsCnt: Nat32;
        firstCommentAt: ?Int;
        lastCommentAt: ?Int;
        lastCommentBy: ?Nat32;
        commenters: [Nat32];
        publishedAt: ?Int;
        expiredAt: ?Int;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
        deletedAt: ?Int;
        deletedBy: ?Nat32;
    };

    public type PetitionRequest = {
        title: Text;
        cover: Text;
        body: Text;
        categoryId: Nat32;
        tags: [Nat32];
        duration: Nat32;
    };
};