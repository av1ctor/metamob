module {
    public type DIP20Interface = actor {
        balanceOf: (who: Principal) -> async Nat;
    };

    public type DIP721Interface = actor {
        balanceOf: (who: Principal) -> async Nat;
    };
};