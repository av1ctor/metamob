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
                name = "campaignId";
                options = [#sortable];
            },
            {
                name = "anonymous";
                options = [#sortable];
            },
            {
                name = "value";
                options = [];
            },
            {
                name = "createdAt";
                options = [#sortable];
            },
            {
                name = "createdBy";
                options = [#sortable];
            }
        ];
    };
};