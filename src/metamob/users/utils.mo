import Array "mo:base/Array";
import Option "mo:base/Option";
import Types "./types";
import ReportRepository "../reports/repository";

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

    public func isModeratingOnEntity(
        user: Types.Profile,
        entityId: Nat32,
        reportRepo: ?ReportRepository.Repository
    ): Bool {
        switch(reportRepo) {
            case (?reportRepo) {
                switch(reportRepo.findAssignedByEntityAndModerator(entityId, user._id, null, null)) {
                    case (#err(_)) {
                        false;
                    };
                    case (#ok(reports)) {
                        reports.size() > 0;
                    };
                };

            };
            case null {
                false;
            };
        };
    };
};