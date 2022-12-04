import React from "react";
import { useFindBoostById } from "../../../hooks/boosts";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const req = useFindBoostById(props.id);
    
    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <Preview 
            boost={req.data}
            partial={props.partial}
        />
    );
};