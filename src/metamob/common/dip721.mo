import Dip721 "../interfaces/dip721";

module {
    public func balanceOf(
        canisterId: Text,
        who: Principal
    ): async Nat {
        let dip721 = actor (canisterId) : Dip721.Interface;
        await dip721.balanceOf(who);
    };

    public func transfer(
        canisterId: Text,
        to: Principal, 
        id: Nat
    ): async Dip721.Result {
        let dip721 = actor (canisterId) : Dip721.Interface;
        await dip721.transfer(to, id);
    };

    public func transferFrom(
        canisterId: Text,
        from: Principal, 
        to: Principal, 
        id: Nat
    ): async Dip721.Result {
        let dip721 = actor (canisterId) : Dip721.Interface;
        await dip721.transferFrom(from, to, id);
    };
};