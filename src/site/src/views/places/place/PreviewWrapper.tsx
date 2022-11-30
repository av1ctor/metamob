import React from "react";
import { useFindPlaceById } from "../../../hooks/places";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const req = useFindPlaceById(props.id);
    
    if(req.status === 'loading' || !req.data) {
        return null;
    }

    return (
        <Preview 
            place={req.data}
            partial={props.partial}
        />
    );
};