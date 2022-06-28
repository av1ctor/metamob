import { Identity } from "@dfinity/agent";
import { _SERVICE as MMT } from "../../../declarations/mmt/mmt.did";

export const getMmtBalance = async (
    identity?: Identity,
    mmt?: MMT
): Promise<bigint> => {
    if(!identity || !mmt) {
        return BigInt(0);
    }

    const principal = identity.getPrincipal();
    
    return await mmt.balanceOf(principal);
};
