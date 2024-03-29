import Array "mo:base/Array";
import Table "mo:mo-table/table";
import Variant "mo:mo-table/variant";
import Utils "../common/utils";

module {
    public type Comparer<T> = (
        column: Text,
        dir: Int
    ) -> (T, T) -> Int;

    public func toCriterias(
        criterias: ?[(Text, Text, Variant.Variant)]
    ): ?[Table.Criteria] {

        switch(criterias) {
            case null {
                null;
            };
            case (?criterias) {
                ?Array.map(
                    criterias, 
                    func (crit: (Text, Text, Variant.Variant)): Table.Criteria {
                        {
                            key = crit.0;
                            op = switch(crit.1) {
                                case "contains" #contains; 
                                case "startsWith" #startsWith;
                                case "between" #between;
                                case "neq" #neq;
                                case "lt" #lt;
                                case "lte" #lte;
                                case "gt" #gt;
                                case "gte" #gte;
                                case _ #eq;
                            };
                            value = switch(crit.2) {
                                case (#text(text)) {
                                    #text(Utils.toLower(text));
                                };
                                case _ {
                                    crit.2;
                                };
                            };
                        }
                    }
                )
            };
        };
    };
    
    public func toSortBy<T>(
        sortBy: ?[(Text, Text)],
        comparer: Comparer<T>
    ): ?[Table.SortBy<T>] {
        switch(sortBy) {
            case null {
                null;
            };
            case (?sortBy) {
                ?Array.map(sortBy, func(s: (Text, Text)): Table.SortBy<T> {
                    let dir = switch(s.1) {
                        case "desc" -1;
                        case _ 1;
                    };

                    {
                        key = s.0;
                        dir = if(dir == 1) #asc else #desc;
                        cmp = comparer(s.0, dir);
                    }
                });
            };
        };
    };

    public func toLimit(
        limit: ?(Nat, Nat)
    ): ?Table.Limit {
        switch(limit) {
            case null {
                null;
            };
            case (?limit) 
                ?{
                    offset = limit.0;
                    size = limit.1;
                }
        };
    };
};