import React from "react";
import { SignatureResponse, ProfileResponse } from "../../../../declarations/metamob/metamob.did";
import { useFindCampaignById } from "../../hooks/campaigns";
import { useFindSignatureByPubId } from "../../hooks/signatures";
import { useFindUserById } from "../../hooks/users";
import {BaseItem, Item} from "./Item";

interface BaseItemProps {
    pubId: string;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (signature: SignatureResponse) => void;
};

export const BaseItemWrapper = (props: BaseItemProps) => {
    const req = useFindSignatureByPubId(props.pubId);
    const author = useFindUserById(req.data?.createdBy);

    if(req.status === 'loading' || !req.data) {
        return <div>Loading...</div>;
    }

    return (
        <BaseItem
            signature={req.data}
            user={props.user || author.data}
            onShowModerations={props.onShowModerations}
        >
            {props.children}
        </BaseItem>
    );
};

interface Props {
    pubId: string,
    onEdit: (signature: SignatureResponse) => void;
    onDelete: (signature: SignatureResponse) => void;
    onReport: (signature: SignatureResponse) => void;
    onShowModerations?: (signature: SignatureResponse) => void;
};

const ItemWrapper = (props: Props) => {
    const req = useFindSignatureByPubId(props.pubId);
    const campaignReq = useFindCampaignById(req.data?.campaignId);

    if(req.status === 'loading' || !req.data) {
        return null;
    }

    return (
        <Item
            signature={req.data}
            campaign={campaignReq.data}
            onDelete={props.onDelete}
            onEdit={props.onEdit}
            onReport={props.onReport}
            onShowModerations={props.onShowModerations}
        />
    );
};

export default ItemWrapper;