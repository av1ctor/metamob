import React from "react";
import { useFindFundingById } from "../../../hooks/fundings";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const req = useFindFundingById(props.id);

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