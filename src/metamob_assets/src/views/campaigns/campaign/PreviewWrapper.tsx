import React from "react";
import { useFindCampaignById } from "../../../hooks/campaigns";
import { Preview } from "./Preview";

interface Props {
    id: number;
    partial?: boolean;
}

export const PreviewWrapper = (props: Props) => {
    
    const req = useFindCampaignById(props.id);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <Preview 
            campaign={req.data}
            partial={props.partial}
        />
    );
};