module {
    public let schema = 
    {
        name = "categories";
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
                name = "name";
                options = [#unique, #partial];
            },
            {
                name = "active";
                options = [];
            },
            {
                name = "description";
                options = [#max(1024)];
            },
            {
                name = "color";
                options = [#max(10)];
            },
            {
                name = "createdAt";
                options = [#sortable];
            },
            {
                name = "createdBy";
                options = [];
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