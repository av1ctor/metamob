import Variant "mo:mo-table/variant";

module {
    public type BackupEntity = {
        config: [(Text, Variant.Variant)];
        staked: [(Principal, Nat)];
        deposited: [(Principal, Nat)];
    };
};