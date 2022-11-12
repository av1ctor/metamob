module {
    public let schema = 
    {
        name = "notifications";
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
                options = [#min(3), #max(128)];
            },
            {
                name = "body";
                options = [#min(0), #max(1024)];
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
                name = "readAt";
                options = [#nullable, #sortable];
            },

        ];
    };
};