import React from "react";
import { useFindUpdateById } from "../../../hooks/updates";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const req = useFindUpdateById(props.id);

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