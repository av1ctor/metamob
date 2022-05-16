import Array "mo:base/Array";
import Option "mo:base/Option";
import Types "./types";

module {
    public func isAdmin(
        user: Types.Profile
    ): Bool {
        Option.isSome(
            Array.find(
                user.roles, 
                func(r: Types.Role): Bool = 
                    r == #admin
            )
        );
    };

    public func isModerator(
        user: Types.Profile
    ): Bool {
        Option.isSome(
            Array.find(
                user.roles, 
                func(r: Types.Role): Bool = 
                    switch(r) {
                        case (#admin) true; 
                        case (#moderator) true; 
                        case _ false;
                    }
            )
        );
    };
};