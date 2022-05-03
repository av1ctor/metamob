import Array "mo:base/Array";
import Option "mo:base/Option";
import Types "./types";

module {
    public func isAdmin(
        user: Types.Profile
    ): Bool {
        Option.isSome(Array.find(user.roles, func(r: Types.Role): Bool = r == #admin));
    };
};