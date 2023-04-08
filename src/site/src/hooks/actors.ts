import { useContext } from "react";
import { ActorContext } from "../stores/actor";
import { Metamob } from "../../../declarations/metamob/metamob.did";
import { _SERVICE as Ledger } from "../../../declarations/ledger/ledger.did";
import { _SERVICE as MMT } from "../../../declarations/mmt/mmt.did";
import { Logger } from "../../../declarations/logger/logger.did";

interface Actors {
    metamob: Metamob;
    ledger: Ledger;
    mmt: MMT;
    logger: Logger;
};

export const useActors = (
): Actors => {
    const [actors, ] = useContext(ActorContext);
    return {
        metamob: actors.metamob,
        ledger: actors.ledger,
        mmt: actors.mmt,
        logger: actors.logger,
    };
};