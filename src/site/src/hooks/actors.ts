import { useContext } from "react";
import { ActorContext } from "../stores/actor";
import { Metamob } from "../../../declarations/metamob/metamob.did";
import { idlFactory as Ledger } from "../../../declarations/ledger";
import { _SERVICE as MMT } from "../../../declarations/mmt/mmt.did";

interface Actors {
    metamob?: Metamob;
    ledger?: Ledger;
    mmt?: MMT;
};

export const useActors = (
): Actors => {
    const [actors, ] = useContext(ActorContext);
    return {
        metamob: actors.metamob,
        ledger: actors.ledger,
        mmt: actors.mmt,
    };
};