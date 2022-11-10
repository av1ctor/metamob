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
import Ledger "../interfaces/ledger";

module {
    public let icp_fee: Nat = 10_000;

    public class LedgerUtils(
        ledgerCanisterId: Text
    ) {
        let ledger: Ledger.Interface = actor(ledgerCanisterId);

        public func getAccountId(
            invoker: Principal,
            this: actor {}
        ): AccountTypes.AccountIdentifier {
            Account.accountIdentifier(
                Principal.fromActor(this), 
                Account.principalToSubaccount(invoker)
            );
        };

        public func getCampaignBalance(
            campaign: CampaignTypes.Campaign,
            this: actor {}
        ): async Nat64 {
            let accountId = Account.accountIdentifier(
                Principal.fromActor(this), 
                Account.textToSubaccount(campaign.pubId)
            );
            let balance = await ledger.account_balance({ account = accountId });
            return balance.e8s;
        };

        public func getUserBalance(
            invoker: Principal,
            this: actor {}
        ): async Nat64 {
            let userAccountId = getAccountId(invoker, this);
            let balance = await ledger.account_balance({ account = userAccountId });
            return balance.e8s;
        };

        public func transferFromUserSubaccount(
            callerId: Nat32,
            amount: Nat64,
            to: AccountTypes.AccountIdentifier,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Nat64, Text> {
            
            let receipt = await ledger.transfer({
                memo: Nat64 = Nat64.fromNat(Nat32.toNat(callerId));
                from_subaccount = ?Account.principalToSubaccount(invoker);
                to = to;
                amount = { e8s = amount - Nat64.fromNat(icp_fee) };
                fee = { e8s = Nat64.fromNat(icp_fee) };
                created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
            });

            switch (receipt) {
                case (#Err(e)) {
                    #err("Transfer failed: " # debug_show(e));
                };
                case _ {
                    #ok(amount);
                };
            };
        };

        public func transferFromUserSubaccountToCampaignSubaccountEx(
            campaign: CampaignTypes.Campaign,
            callerId: Nat32,
            amount: Nat64,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Nat64, Text> {
            
            let receipt = await ledger.transfer({
                memo: Nat64 = Nat64.fromNat(Nat32.toNat(callerId));
                from_subaccount = ?Account.principalToSubaccount(invoker);
                to = Account.accountIdentifier(
                    Principal.fromActor(this), 
                    Account.textToSubaccount(campaign.pubId)
                );
                amount = { e8s = amount - Nat64.fromNat(icp_fee) };
                fee = { e8s = Nat64.fromNat(icp_fee) };
                created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
            });

            switch (receipt) {
                case (#Err(e)) {
                    #err("Transfer failed: " # debug_show(e));
                };
                case _ {
                    #ok(amount);
                };
            };
        };

        public func transferFromUserSubaccountToCampaignSubaccount(
            campaign: CampaignTypes.Campaign,
            callerId: Nat32,
            invoker: Principal,
            this: actor {}
        ): async Result.Result<Nat64, Text> {
            await transferFromUserSubaccountToCampaignSubaccountEx(
                campaign, 
                callerId, 
                await getUserBalance(invoker, this), 
                invoker, 
                this
            );
        };

        public func withdrawFromCampaignSubaccount(
            campaign: CampaignTypes.Campaign,
            amount: Nat64,
            to: AccountTypes.AccountIdentifier,
            callerId: Nat32
        ): async Result.Result<(), Text> {
            
            let receipt = await ledger.transfer({
                memo: Nat64 = Nat64.fromNat(Nat32.toNat(callerId));
                from_subaccount = ?Account.textToSubaccount(campaign.pubId);
                to = to;
                amount = { e8s = amount - Nat64.fromNat(icp_fee) };
                fee = { e8s = Nat64.fromNat(icp_fee) };
                created_at_time = ?{ timestamp_nanos = Nat64.fromNat(Int.abs(Time.now())) };
            });

            switch (receipt) {
                case (#Err(e)) {
                    #err("Withdraw failed: " # debug_show(e));
                };
                case _ {
                    #ok();
                };
            };
        };

        public func withdrawFromCampaignSubaccountLessTax(
            campaign: CampaignTypes.Campaign,
            amount: Nat64,
            tax: Nat64,
            to: AccountTypes.AccountIdentifier,
            appAccountId: AccountTypes.AccountIdentifier,
            callerId: Nat32
        ): async Result.Result<(), Text> {
            let cut = (amount * (100 - tax)) / 100;
            
            switch(await withdrawFromCampaignSubaccount(
                campaign, 
                amount - cut, 
                to, 
                callerId
            )) {
                case (#err(msg)) {
                    #err(msg);
                };
                case _ {
                    if(cut > Nat64.fromNat(icp_fee)) {
                        await withdrawFromCampaignSubaccount(
                            campaign, 
                            cut, 
                            appAccountId, 
                            callerId
                        );
                    }
                    else {
                        #ok();
                    };
                };
            };
        };
    };
};