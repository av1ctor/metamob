module {
    public type EntityType = Nat32;
    public let TYPE_CAMPAIGNS: Nat32 = 0;
    public let TYPE_USERS: Nat32 = 1;
    public let TYPE_SIGNATURES: Nat32 = 2;
    public let TYPE_UPDATES: Nat32 = 3;
    public let TYPE_VOTES: Nat32 = 4;
    public let TYPE_DONATIONS: Nat32 = 5;
    public let TYPE_FUNDINGS: Nat32 = 6;
    public let TYPE_PLACES: Nat32 = 7;
    public let TYPE_POAPS: Nat32 = 8;

    public func toText(
        t: EntityType
    ): Text {
        if(t == TYPE_CAMPAIGNS) {
            "Campaign";
        }
        else if(t == TYPE_USERS) {
            "User";
        }
        else if(t == TYPE_SIGNATURES) {
            "Signature";
        }
        else if(t == TYPE_UPDATES) {
            "Update";
        }
        else if(t == TYPE_VOTES) {
            "Vote";
        }
        else if(t == TYPE_DONATIONS) {
            "Donation";
        }
        else if(t == TYPE_FUNDINGS) {
            "Fundraising";
        }
        else if(t == TYPE_PLACES) {
            "Place";
        }        
        else if(t == TYPE_POAPS) {
            "POAP";
        }        
        else {
            "Unknown"
        };
    };
}