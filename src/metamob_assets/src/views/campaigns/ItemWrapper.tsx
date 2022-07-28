import React from "react";
import { useFindCampaignByPubId } from "../../hooks/campaigns";
import Item from "./Item";

interface Props {
    pubId: string,
    isPreview?: boolean;
    showBody?: boolean;
};

const ItemWrapper = (props: Props) => {
    
    const req = useFindCampaignByPubId(props.pubId);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <Item
            campaign={req.data}
            isPreview={props.isPreview}
            showBody={props.showBody}
        />
    );
};

export default ItemWrapper;