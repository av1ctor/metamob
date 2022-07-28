import React from "react";
import { FundingResponse, ProfileResponse } from "../../../../declarations/metamob/metamob.did";
import { useFindCampaignById } from "../../hooks/campaigns";
import { useFindFundingByPubId } from "../../hooks/fundings";
import { useFindUserById } from "../../hooks/users";
import {BaseItem, Item} from "./Item";

interface BaseItemProps {
    pubId: string;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (funding: FundingResponse) => void;
};

export const BaseItemWrapper = (props: BaseItemProps) => {
    const req = useFindFundingByPubId(props.pubId);
    const creatorReq = useFindUserById(req.data?.createdBy);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <BaseItem
            funding={req.data}
            user={props.user || creatorReq.data}
            onShowModerations={props.onShowModerations}
        >
            {props.children}
        </BaseItem>
    );
};

interface Props {
    pubId: string,
    onEdit: (funding: FundingResponse) => void;
    onDelete: (funding: FundingResponse) => void;
    onReport: (funding: FundingResponse) => void;
    onShowModerations?: (funding: FundingResponse) => void;
};

const ItemWrapper = (props: Props) => {
    const req = useFindFundingByPubId(props.pubId);
    const campaignReq = useFindCampaignById(req.data?.campaignId);

    if(req.status === 'loading' || !req.data) {
        return null;
    }

    return (
        <Item
            funding={req.data}
            campaign={campaignReq.data}
            onDelete={props.onDelete}
            onEdit={props.onEdit}
            onReport={props.onReport}
            onShowModerations={props.onShowModerations}
        />
    );
};

export default ItemWrapper;