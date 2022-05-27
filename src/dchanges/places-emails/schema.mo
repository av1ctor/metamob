module {
    public let schema = 
    {
        name = "places-emails";
        version = 1.0;
        columns = [
            {
                name = "_id";
                options = [#primary];
            },
            {
                name = "placeId";
                options = [#sortable];
            },
            {
                name = "email";
                options = [#sortable, #min(6), #max(64)];
            }
        ];
    };
};