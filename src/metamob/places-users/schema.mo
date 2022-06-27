module {
    public let schema = 
    {
        name = "places-users";
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
                name = "userId";
                options = [#sortable];
            },
            {
                name = "termsAccepted";
                options = [];
            }
        ];
    };
};