module {
    public type PlaceUser = {
        _id: Nat32;
        placeId: Nat32;
        userId: Nat32;
        termsAccepted: Bool;
    };

    public type PlaceUserRequest = {
        placeId: Nat32;
        termsAccepted: Bool;
    };
};