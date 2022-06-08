module {
    public type PlaceEmail = {
        _id: Nat32;
        placeId: Nat32;
        email: Text;
    };

    public type PlaceEmailRequest = {
        placeId: Nat32;
        email: Text;
    };
};