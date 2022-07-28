import React from "react";
import { VoteResponse, ProfileResponse } from "../../../../declarations/metamob/metamob.did";
import { useFindCampaignById } from "../../hooks/campaigns";
import { useFindUserById } from "../../hooks/users";
import { useFindVoteByPubId } from "../../hooks/votes";
import {BaseItem, Item} from "./Item";

interface BaseItemProps {
    pubId: string;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (vote: VoteResponse) => void;
};

export const BaseItemWrapper = (props: BaseItemProps) => {
    const req = useFindVoteByPubId(props.pubId);
    const creatorReq = useFindUserById(req.data?.createdBy);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <BaseItem
            vote={req.data}
            user={props.user || creatorReq.data}
            onShowModerations={props.onShowModerations}
        >
            {props.children}
        </BaseItem>
    );
};

interface Props {
    pubId: string,
    onEdit: (vote: VoteResponse) => void;
    onDelete: (vote: VoteResponse) => void;
    onReport: (vote: VoteResponse) => void;
    onShowModerations?: (vote: VoteResponse) => void;
};

const ItemWrapper = (props: Props) => {
    const req = useFindVoteByPubId(props.pubId);
    const campaignReq = useFindCampaignById(req.data?.campaignId);

    if(req.status === 'loading' || !req.data) {
        return null;
    }

    return (
        <Item
            vote={req.data}
            campaign={campaignReq.data}
            onDelete={props.onDelete}
            onEdit={props.onEdit}
            onReport={props.onReport}
            onShowModerations={props.onShowModerations}
        />
    );
};

export default ItemWrapper;