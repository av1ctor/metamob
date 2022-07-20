module {
    public let schema = 
    {
        name = "moderations";
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
                options = [#sortable];
            },
            {
                name = "reason";
                options = [];
            },
            {
                name = "action";
                options = [];
            },
            {
                name = "body";
                options = [#min(10), #max(4096)];
            },
            {
                name = "reportId";
                options = [#sortable];
            },
            {
                name = "entityType";
                options = [#sortable];
            },
            {
                name = "entityId";
                options = [#sortable];
            },
            {
                name = "challengeId";
                options = [#nullable];
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