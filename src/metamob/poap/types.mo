import ModerationTypes "../moderations/types";

module {
    public type PoapState = Nat32; 
    public let POAP_STATE_MINTING: Nat32 = 0;
    public let POAP_STATE_PAUSED: Nat32 = 1;
    public let POAP_STATE_CANCELLED: Nat32 = 2;
    public let POAP_STATE_ENDED: Nat32 = 3;

    public type PoapOptions = Nat32; 
    public let POAP_OPTIONS_NONE: Nat32 = 0;

    public type Poap = {
        _id: Nat32;
        pubId: Text;
        state: PoapState;
        campaignId: Nat32;
        canisterId: Text;
        logo: Text;
        name: Text;
        symbol: Text;
        width: Nat32;
        height: Nat32;
        price: Nat64;
        totalSupply: Nat32;
        maxSupply: ?Nat32;
        body: Text;
        options: PoapOptions;
        moderated: ModerationTypes.ModerationReason;
        createdAt: Int;
        createdBy: Nat32;
        updatedAt: ?Int;
        updatedBy: ?Nat32;
    };

    public type PoapRequest = {
        campaignId: Nat32;
        logo: Text;
        name: Text;
        symbol: Text;
        width: Nat32;
        height: Nat32;
        price: Nat64;
        maxSupply: ?Nat32;
        body: Text;
        options: PoapOptions;
    };
};