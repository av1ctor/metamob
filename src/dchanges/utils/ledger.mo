import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Variant "mo:mo-table/variant";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import CampaignTypes "../campaigns/types";
import Account "../accounts/account";
import AccountTypes "../accounts/types";
import Ledger "canister:ledger";

module {
    let icp_fee: Nat = 10_000;

    public func getAccountId(
        invoker: Principal,
        this: actor {}
    ): AccountTypes.AccountIdentifier {
        Account.accountIdentifier(
            Principal.fromActor(this), 
            Account.principalToSubaccount(invoker)
        );
    };

    public func transferFromUserSubaccountToCampaignSubaccount(
        campaign: CampaignTypes.Campaign,
        caller: UserTypes.Profile,
        invoker: Principal,
        this: actor {}
    ): async Result.Result<Nat64, Text> {
        let userAccountId = getAccountId(invoker, this);
        let balance = await Ledger.account_balance({ account = userAccountId });
        let amount = balance.e8s;
        
        let receipt = await Ledger.transfer({
            memo: Nat64 = Nat64.fromNat(Nat32.toNat(caller._id));
            from_subaccount = ?Account.principalToSubaccount(invoker);
            to = Account.accountIdentifier(Principal.fromActor(this), Account.textToSubaccount(campaign.pubId));
            amount = { e8s = amount - Nat64.fromNat(icp_fee) };
            fee = { e8s = Nat64.fromNat(icp_fee) };
            created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
        });

        switch (receipt) {
            case (#Err _) {
                #err("Transfer failed");
            };
            case _ {
                #ok(amount);
            };
        };
    };

    public func transferFromCampaignSubaccountToUserAccount(
        campaign: CampaignTypes.Campaign,
        amount: Nat,
        caller: UserTypes.Profile,
        invoker: Principal,
        this: actor {}
    ): async Result.Result<(), Text> {
        
        let receipt = await Ledger.transfer({
            memo: Nat64 = Nat64.fromNat(Nat32.toNat(caller._id));
            from_subaccount = ?Account.textToSubaccount(campaign.pubId);
            to = Account.accountIdentifier(invoker, Account.defaultSubaccount());
            amount = { e8s = Nat64.fromNat(amount) - Nat64.fromNat(icp_fee) };
            fee = { e8s = Nat64.fromNat(icp_fee) };
            created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
        });

        switch (receipt) {
            case (#Err _) {
                #err("Transfer failed");
            };
            case _ {
                #ok();
            };
        };
    };
};