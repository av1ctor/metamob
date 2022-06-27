module {
    public let schema = 
    {
        name = "places";
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
                options = [#unique, #partial, #min(3), #max(96)];
            },
            {
                name = "kind";
                options = [#sortable];
            },
            {
                name = "auth";
                options = [];
            },
            {
                name = "description";
                options = [#min(3), #max(1024)];
            },
            {
                name = "active";
                options = [#sortable];
            },
            {
                name = "lat";
                options = [];
            },
            {
                name = "lng";
                options = [];
            },
            {
                name = "icon";
                options = [#max(512)];
            },
            {
                name = "banner";
                options = [#nullable, #max(512)];
            },
            {
                name = "terms";
                options = [#nullable, #max(32768)];
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