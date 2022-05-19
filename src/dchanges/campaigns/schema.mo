module {
    public let schema = 
    {
        name = "campaigns";
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
                options = [#partial, #min(10), #max(128)];
            },
            {
                name = "target";
                options = [#partial, #min(3), #max(64)];
            },
            {
                name = "cover";
                options = [#min(7), #max(256)];
            },
            {
                name = "body";
                options = [#min(100), #max(4096)];
            },
            {
                name = "categoryId";
                options = [#sortable];
            },
            {
                name = "placeId";
                options = [#sortable];
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
                name = "duration";
                options = [#min(1), #max(365)];
            },
            {
                name = "tags";
                options = [#multiple, #sortable, #max(5)];
            },
            {
                name = "signaturesCnt";
                options = [#sortable];
            },
            {
                name = "firstSignatureAt";
                options = [#nullable];
            },
            {
                name = "lastSignatureAt";
                options = [#nullable];
            },
            {
                name = "lastSignatureBy";
                options = [#nullable];
            },
            {
                name = "signaturers";
                options = [#multiple];
            },
            {
                name = "updatesCnt";
                options = [#sortable];
            },
            {
                name = "publishedAt";
                options = [#nullable, #sortable];
            },
            {
                name = "expiredAt";
                options = [#nullable, #sortable];
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
                options = [#nullable, #sortable];
            },
            {
                name = "updatedBy";
                options = [#nullable];
            },
            {
                name = "deletedAt";
                options = [#nullable, #sortable];
            },
            {
                name = "deletedBy";
                options = [#nullable];
            }
        ];
    };
};