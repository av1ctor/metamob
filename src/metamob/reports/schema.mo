module {
    public let schema = 
    {
        name = "reports";
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
                name = "result";
                options = [#sortable];
            },
            {
                name = "kind";
                options = [];
            },
            {
                name = "description";
                options = [#min(10), #max(4096)];
            },
            {
                name = "resolution";
                options = [#max(4096)];
            },
            {
                name = "entityType";
                options = [#sortable];
            },
            {
                name = "entityId";
                options = [];
            },
            {
                name = "entityPubId";
                options = [];
            },
            {
                name = "entityCreatedBy";
                options = [#sortable];
            },
            {
                name = "moderationId";
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
            },
            {
                name = "assignedAt";
                options = [#sortable];
            },
            {
                name = "assignedTo";
                options = [#sortable];
            },
            {
                name = "dueAt";
                options = [#sortable];
            }
        ];
    };
};