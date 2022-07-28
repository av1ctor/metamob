import React, { useContext } from "react";
import { useFindDonationById } from "../../../hooks/donations";
import { ActorContext } from "../../../stores/actor";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    
    const req = useFindDonationById(props.id, actors.main);
    
    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <Preview 
            donation={req.data}
            partial={props.partial}
        />
    );
};