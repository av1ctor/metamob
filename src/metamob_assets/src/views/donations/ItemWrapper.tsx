import React from "react";
import { DonationResponse, ProfileResponse } from "../../../../declarations/metamob/metamob.did";
import { useFindCampaignById } from "../../hooks/campaigns";
import { useFindDonationByPubId } from "../../hooks/donations";
import { useFindUserById } from "../../hooks/users";
import {BaseItem, Item} from "./Item";

interface BaseItemProps {
    pubId: string;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (donation: DonationResponse) => void;
};

export const BaseItemWrapper = (props: BaseItemProps) => {
    const req = useFindDonationByPubId(props.pubId);
    const creatorReq = useFindUserById(req.data?.createdBy);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <BaseItem
            donation={req.data}
            user={props.user || creatorReq.data}
            onShowModerations={props.onShowModerations}
        >
            {props.children}
        </BaseItem>
    );
};

interface Props {
    pubId: string,
    onEdit: (donation: DonationResponse) => void;
    onDelete: (donation: DonationResponse) => void;
    onReport: (donation: DonationResponse) => void;
    onShowModerations?: (donation: DonationResponse) => void;
};

const ItemWrapper = (props: Props) => {
    const req = useFindDonationByPubId(props.pubId);
    const campaignReq = useFindCampaignById(req.data?.campaignId);

    if(req.status === 'loading' || !req.data) {
        return null;
    }

    return (
        <Item
            donation={req.data}
            campaign={campaignReq.data}
            onDelete={props.onDelete}
            onEdit={props.onEdit}
            onReport={props.onReport}
            onShowModerations={props.onShowModerations}
        />
    );
};

export default ItemWrapper;