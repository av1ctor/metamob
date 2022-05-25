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
                name = "body";
                options = [];
            },
            {
                name = "value";
                options = [#min(10_001 /* ICP transfer fee + 1 */)];
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