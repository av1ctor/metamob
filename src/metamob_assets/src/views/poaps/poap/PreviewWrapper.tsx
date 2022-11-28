import React from "react";
import { useFindPoapById } from "../../../hooks/poap";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const req = useFindPoapById(props.id);
    
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