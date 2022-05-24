module {
    public let schema = 
    {
        name = "votes";
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
                name = "campaignId";
                options = [#sortable];
            },
            {
                name = "anonymous";
                options = [#sortable];
            },
            {
                name = "body";
                options = [];
            },
            {
                name = "pro";
                options = [];
            },
            {
                name = "weight";
                options = [];
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
                options = [#nullable];
            },
            {
                name = "updatedBy";
                options = [#nullable];
            }
        ];
    };
};