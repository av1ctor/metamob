import Principal "mo:base/Principal";
import Dip20 "../interfaces/dip20";

module {

    public func balanceOf(
        canisterId: Text,
        who: Principal
    ): async Nat {
        let dip20 = actor (canisterId) : Dip20.Interface;
        await dip20.balanceOf(who);
    };

    public func transfer(
        canisterId: Text,
        to: Principal, 
        value: Nat
    ): async Dip20.TxReceipt {
        let dip20 = actor (canisterId) : Dip20.Interface;
        await dip20.transfer(to, value);
    };

    public func transferFrom(
        canisterId: Text,
        from: Principal, 
        to: Principal, 
        value: Nat
    ): async Dip20.TxReceipt {
        let dip20 = actor (canisterId) : Dip20.Interface;
        await dip20.transferFrom(from, to, value);
    };
};