module {
    public let schema = 
    {
        name = "petitions";
        version = 1.0;
        columns = [
            {
                name = "_id";
                options = [#primary];
            },
            {
                name = "pubId";
                options = [#unique];
            },
            {
                name = "title";
                options = [#unique, #partial];
            },
            {
                name = "cover";
                options = [];
            },
            {
                name = "body";
                options = [#partial];
            },
            {
                name = "categoryId";
                options = [#sortable];
            },
            {
                name = "state";
                options = [#sortable];
            },
            {
                name = "result";
                options = [#sortable];
            },
            {
                name = "duration";
                options = [];
            },
            {
                name = "tags";
                options = [#multiple, #sortable];
            },
            {
                name = "likes";
                options = [#sortable];
            },
            {
                name = "dislikes";
                options = [#sortable];
            },
            {
                name = "commentsCnt";
                options = [#sortable];
            },
            {
                name = "firstCommentAt";
                options = [#nullable];
            },
            {
                name = "lastCommentAt";
                options = [#nullable];
            },
            {
                name = "lastCommentBy";
                options = [#nullable];
            },
            {
                name = "commenters";
                options = [#multiple];
            },
            {
                name = "publishedAt";
                options = [#nullable, #sortable];
            },
            {
                name = "expiredAt";
                options = [#nullable, #sortable];
            },
            {
                name = "createdAt";
                options = [#sortable];
            },
            {
                name = "createdBy";
                options = [];
            },
            {
                name = "updatedAt";
                options = [#nullable, #sortable];
            },
            {
                name = "updatedBy";
                options = [#nullable];
            },
            {
                name = "deletedAt";
                options = [#nullable, #sortable];
            },
            {
                name = "deletedBy";
                options = [#nullable];
            }
        ];
    };
};