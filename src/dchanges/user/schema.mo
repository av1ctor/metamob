module {
    public let schema = 
    {
        name = "users";
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
                name = "avatar";
                options = [#nullable];
            },
            {
                name = "roles";
                options = [#multiple, #sortable];
            },
            {
                name = "active";
                options = [];
            },
            {
                name = "banned";
                options = [];
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