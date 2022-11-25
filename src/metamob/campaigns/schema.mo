module {
    public let schema = 
    {
        name = "campaigns";
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
                name = "kind";
                options = [];
            },
            {
                name = "title";
                options = [#partial, #min(10), #max(128)];
            },
            {
                name = "target";
                options = [#partial, #min(3), #max(64)];
            },
            {
                name = "cover";
                options = [#min(7), #max(256)];
            },
            {
                name = "body";
                options = [#min(100), #max(4096)];
            },
            {
                name = "categoryId";
                options = [#sortable];
            },
            {
                name = "placeId";
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
                options = [#min(1), #max(365)];
            },
            {
                name = "tags";
                options = [#multiple, #sortable, #max(5)];
            },
            {
                name = "boosting";
                options = [#sortable];
            },
            {
                name = "goal";
                options = [];
            },
            {
                name = "total";
                options = [#sortable];
            },
            {
                name = "interactions";
                options = [#sortable];
            },
            {
                name = "updates";
                options = [];
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
                options = [#sortable];
            },
            {
                name = "updatedAt";
                options = [#nullable, #sortable];
            },
            {
                name = "updatedBy";
                options = [#nullable];
            }
        ];
    };
};