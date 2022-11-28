import React from "react";
import { useFindSignatureById } from "../../../hooks/signatures";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    const req = useFindSignatureById(props.id);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <Preview 
            signature={req.data}
            partial={props.partial}
        />
    );
};