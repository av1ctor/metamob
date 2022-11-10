import React, { useContext } from "react";
import { useFindPoapById } from "../../../hooks/poap";
import { ActorContext } from "../../../stores/actor";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    
    const req = useFindPoapById(props.id, actors.main);
    
    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <Preview 
            poap={req.data}
            partial={props.partial}
        />
    );
};