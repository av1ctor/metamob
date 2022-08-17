module {
    public let schema = 
    {
        name = "challenges";
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
                name = "description";
                options = [#min(10), #max(4096)];
            },
            {
                name = "moderationId";
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
                name = "judges";
                options = [#multiple, #sortable, #min(1)];
            },
            {
                name = "votes";
                options = [#multiple];
            },
            {
                name = "result";
                options = [#sortable];
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
            },
            {
                name = "dueAt";
                options = [#sortable];
            }
        ];
    };
};