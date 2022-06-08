module {
    public let schema = 
    {
        name = "donations";
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
                name = "state";
                options = [];
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
                name = "value";
                options = [#min(100_000 /* ICP transfer fee * 10 */)];
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