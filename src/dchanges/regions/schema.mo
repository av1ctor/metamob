module {
    public let schema = 
    {
        name = "regions";
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
                name = "parentId";
                options = [#nullable];
            },
            {
                name = "name";
                options = [#unique, #partial, #min(3), #max(4096)];
            },
            {
                name = "kind";
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
            }
        ];
    };
};