import React, { useContext } from "react";
import { Update, ProfileResponse } from "../../../../declarations/metamob/metamob.did";
import { useFindCampaignById } from "../../hooks/campaigns";
import { useFindUpdateByPubId } from "../../hooks/updates";
import { CampaignState } from "../../libs/campaigns";
import { AuthContext } from "../../stores/auth";
import {BaseItem, Item} from "./Item";

interface BaseItemProps {
    pubId: string;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (update: Update) => void;
};

export const BaseItemWrapper = (props: BaseItemProps) => {
    const req = useFindUpdateByPubId(props.pubId);

    if(req.status === 'loading' || !req.data) {
        return null;
    }

    return (
        <BaseItem
            update={req.data}
            user={props.user}
            onShowModerations={props.onShowModerations}
        >
            {props.children}
        </BaseItem>
    );
};

interface Props {
    pubId: string,
    onEdit: (update: Update) => void;
    onDelete: (update: Update) => void;
    onReport: (update: Update) => void;
    onShowModerations?: (update: Update) => void;
};

const ItemWrapper = (props: Props) => {
    const [auth] = useContext(AuthContext);

    const req = useFindUpdateByPubId(props.pubId);
    const campaignReq = useFindCampaignById(req.data?.campaignId);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    const canEdit = (campaignReq.data?.state === CampaignState.PUBLISHED && 
        auth.user && auth.user._id === campaignReq.data?.createdBy);

    return (
        <Item
            update={req.data}
            canEdit={canEdit || false}
            onDelete={props.onDelete}
            onEdit={props.onEdit}
            onReport={props.onReport}
            onShowModerations={props.onShowModerations}
        />
    );
};

export default ItemWrapper;