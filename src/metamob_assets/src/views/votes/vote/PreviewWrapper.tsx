import React from "react";
import { useFindVoteById } from "../../../hooks/votes";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const req = useFindVoteById(props.id);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <Preview 
            vote={req.data}
            partial={props.partial}
        />
    );
};