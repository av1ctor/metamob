module {
    public let schema = 
    {
        name = "comments";
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
                name = "body";
                options = [#partial];
            },
            {
                name = "petitionId";
                options = [#sortable];
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
                name = "createdAt";
                options = [#sortable];
            },
            {
                name = "createdBy";
                options = [];
            },
            {
                name = "updatedAt";
                options = [#nullable];
            },
            {
                name = "updatedBy";
                options = [#nullable];
            }
        ];
    };
};