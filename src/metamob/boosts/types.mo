import AccountTypes "../accounts/types";
import PaymentTypes "../payments/types";

module {
    public type BoostState = Nat32;
    public let STATE_CREATED: Nat32 = 0;
    public let STATE_COMPLETED: Nat32 = 1;

    public type Boost = {
        _id: Nat32;
        pubId: Text;
        state: BoostState;
        campaignId: Nat32;
        anonymous: Bool;
        currency: PaymentTypes.CurrencyType;
        value: Nat;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type BoostRequest = {
        campaignId: Nat32;
        anonymous: Bool;
        currency: PaymentTypes.CurrencyType;
        value: Nat;
    };

    public type BoostResponse = {
        _id: Nat32;
        pubId: Text;
        state: BoostState;
        campaignId: Nat32;
        anonymous: Bool;
        currency: PaymentTypes.CurrencyType;
        value: Nat;
        createdAt: Int;
        createdBy: ?Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };    
};