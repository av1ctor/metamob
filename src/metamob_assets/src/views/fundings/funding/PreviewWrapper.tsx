import React, { useContext } from "react";
import { useFindFundingById } from "../../../hooks/fundings";
import { ActorContext } from "../../../stores/actor";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const req = useFindFundingById(props.id, actorState.main);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <Preview 
            funding={req.data}
            partial={props.partial}
        />
    );
};