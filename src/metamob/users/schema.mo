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
                name = "principal";
                options = [#unique];
            },
            {
                name = "name";
                options = [#unique, #partial, #min(3), #max(64)];
            },
            {
                name = "email";
                options = [#unique, #min(6), #max(64)];
            },
            {
                name = "country";
                options = [#sortable, #min(2), #max(4)];
            },
            {
                name = "avatar";
                options = [#nullable, #max(256)];
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