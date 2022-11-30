import React from "react";
import { useFindDonationById } from "../../../hooks/donations";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const req = useFindDonationById(props.id);
    
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