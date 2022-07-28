import React from "react";
import { useContext } from "react";
import { useFindUpdateById } from "../../../hooks/updates";
import { ActorContext } from "../../../stores/actor";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    
    const req = useFindUpdateById(props.id, actors.main);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <Preview
            update={req.data}
            partial={props.partial}
        />
    );
};