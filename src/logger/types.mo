module {
    public type MsgKind = Nat8;
    public let MSG_KIND_ERROR: Nat8 = 0;
    public let MSG_KIND_WARN: Nat8 = 1;
    public let MSG_KIND_INFO: Nat8 = 2;

    public type Msg = {
        kind: MsgKind;
        act: Principal;
        msg: Text;
        date: Int;
    };
};