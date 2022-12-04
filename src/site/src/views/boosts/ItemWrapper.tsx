import React from "react";
import { BoostResponse, ProfileResponse } from "../../../../declarations/metamob/metamob.did";
import { useFindCampaignById } from "../../hooks/campaigns";
import { useFindBoostByPubId } from "../../hooks/boosts";
import { useFindUserById } from "../../hooks/users";
import {BaseItem, Item} from "./Item";

interface BaseItemProps {
    pubId: string;
    user?: ProfileResponse;
    children?: any;
};

export const BaseItemWrapper = (props: BaseItemProps) => {
    const req = useFindBoostByPubId(props.pubId);
    const author = useFindUserById(req.data?.createdBy);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <BaseItem
            boost={req.data}
            user={props.user || author.data}
        >
            {props.children}
        </BaseItem>
    );
};

interface Props {
    pubId: string,
    onEdit: (boost: BoostResponse) => void;
};

const ItemWrapper = (props: Props) => {
    const req = useFindBoostByPubId(props.pubId);
    const campaignReq = useFindCampaignById(req.data?.campaignId);

    if(req.status === 'loading' || !req.data) {
        return null;
    }

    return (
        <Item
            boost={req.data}
            campaign={campaignReq.data}
            onEdit={props.onEdit}
        />
    );
};

export default ItemWrapper;