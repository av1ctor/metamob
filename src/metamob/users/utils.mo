import Array "mo:base/Array";
import EntityTypes "../common/entities";
import Option "mo:base/Option";
import ReportTypes "../reports/types";
import ReportRepository "../reports/repository";
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

    public func isModeratingOnEntity(
        user: Types.Profile,
        entityType: EntityTypes.EntityType,
        entityId: Nat32,
        report: ReportTypes.Report
    ): Bool {
        report.entityId == entityId 
            and report.entityType == entityType
            and report.assignedTo == user._id
            and (report.state == ReportTypes.STATE_ASSIGNED or report.state == ReportTypes.STATE_MODERATING)
            and report.result == ReportTypes.RESULT_VERIFYING;
    };
};