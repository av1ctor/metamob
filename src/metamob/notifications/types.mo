module {
    public type Notification = {
        _id: Nat32;
        pubId: Text;
        title: Text;
        body: Text;
        createdAt: Int;
        createdBy: Nat32;
        readAt: ?Int;
    };

    public type NotificationRequest = {
        title: Text;
        body: Text;
    };
};