import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Nat64 "mo:base/Nat64";
import Variant "mo:mo-table/variant";
import Utils "../common/utils";
import DaoService "../dao/service";
import UserService "../users/service";
import UserTypes "../users/types";
import UserUtils "../users/utils";
import BtcHelper "../common/btchelper";
import Types "types";

module {
    public class Service(
        daoService: DaoService.Service,
        userService: UserService.Service,
        btcHelper: BtcHelper.BtcHelper
    ) {
        
        public func calcValueInIcp(
            currency: Types.CurrencyType,
            value: Nat
        ): Nat {
            if(currency == Types.CURRENCY_ICP) {
                return value;
            } 
            else if(currency == Types.CURRENCY_BTC) {
                let rate = Nat64.toNat(daoService.config.getAsNat64("RATE_BTC_ICP"));
                return (value * rate) / 10000;
            };

            value
        };
        
        public func getBtcAddressOfCampaignAndUser(
            campaignId: Nat32,
            invoker: Principal
        ): async* Result.Result<Text, Text> {
            switch(userService.findByPrincipal(invoker)) {
                case (#err(msg)) {
                    #err(msg);
                };
                case (#ok(caller)) {
                    if(not hasAuth(caller)) {
                        return #err("Forbidden");
                    };
                    
                    #ok(await* getBtcAddressOfCampaignAndUserEx(campaignId, caller._id));
                };
            };
        };

        public func getBtcAddressOfCampaignAndUserEx(
            campaignId: Nat32,
            userId: Nat32
        ): async* Text {
            let path = [Utils.nat32ToArrayBE(campaignId), Utils.nat32ToArrayBE(userId)];
            await* btcHelper.getAddress(path);
        };

        public func addPendingBtcDeposit(
            id: Text,
            address: Text,
            value: Nat64,
            method: Text,
            args: [Variant.MapEntry],
            this: actor {}
        ): async* Result.Result<(), Text> {
            await* btcHelper.addPendingDeposit(
                id,
                address,
                value,
                {
                    act = Principal.fromActor(this);
                    method = method;
                    args = to_candid(args);
                }
            );
        };

        func hasAuth(
            caller: UserTypes.Profile
        ): Bool {
            if(not caller.active) {
                return false;
            };

            if((caller.banned & UserTypes.BANNED_AS_USER) > 0) {
                return false;
            };

            return true;
        };
    };

    public func currencyToString(
        currency: Types.CurrencyType
    ): Text {
        if(currency == Types.CURRENCY_BTC) {
            "BTC"
        }
        else {
            "ICP"
        };
    };
};