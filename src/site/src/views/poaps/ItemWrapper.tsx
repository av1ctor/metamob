import React from "react";
import { Poap, ProfileResponse } from "../../../../declarations/metamob/metamob.did";
import { useFindCampaignById } from "../../hooks/campaigns";
import { useFindPoapByPubId } from "../../hooks/poap";
import { useFindUserById } from "../../hooks/users";
import {BaseItem, Item} from "./Item";

interface BaseItemProps {
    pubId: string;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (poap: Poap) => void;
};

export const BaseItemWrapper = (props: BaseItemProps) => {
    const req = useFindPoapByPubId(props.pubId);
    const creatorReq = useFindUserById(req.data?.createdBy);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <BaseItem
            poap={req.data}
            user={props.user || creatorReq.data}
            onShowModerations={props.onShowModerations}
        >
            {props.children}
        </BaseItem>
    );
};

interface Props {
    pubId: string,
    onEdit: (poap: Poap) => void;
    onDelete: (poap: Poap) => void;
    onReport: (poap: Poap) => void;
    onShowModerations?: (poap: Poap) => void;
};

const ItemWrapper = (props: Props) => {
    const req = useFindPoapByPubId(props.pubId);
    const campaignReq = useFindCampaignById(req.data?.campaignId);

    if(req.status === 'loading' || !req.data) {
        return null;
    }

    return (
        <Item
            poap={req.data}
            campaign={campaignReq.data}
            onDelete={props.onDelete}
            onEdit={props.onEdit}
            onReport={props.onReport}
            onShowModerations={props.onShowModerations}
        />
    );
};

export default ItemWrapper;