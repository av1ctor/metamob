module {
    public let schema = 
    {
        name = "poap";
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
                name = "state";
                options = [];
            },
            {
                name = "canisterId";
                options = [#unique];
            },
            {
                name = "name";
                options = [#min(3), #max(64)];
            },
            {
                name = "symbol";
                options = [#min(3), #max(8)];
            },
            {
                name = "logo";
                options = [#min(6), #max(8192)];
            },
            {
                name = "width";
                options = [#min(50), #max(4096)];
            },
            {
                name = "height";
                options = [#min(50), #max(4096)];
            },
            {
                name = "price";
                options = [];
            },
            {
                name = "totalSupply";
                options = [];
            },
            {
                name = "maxSupply";
                options = [#nullable];
            },
            {
                name = "body";
                options = [#min(6), #max(8192)];
            },
            {
                name = "options";
                options = [];
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