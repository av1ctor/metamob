import React from "react";
import CampaignItem from "../../campaigns/ItemWrapper";
import { BaseItemWrapper as DonationItem } from "../../donations/ItemWrapper";
import { BaseItemWrapper as SignatureItem } from "../../signatures/ItemWrapper";
import { BaseItemWrapper as VoteItem } from "../../votes/ItemWrapper";
import { BaseItemWrapper as FundingItem } from "../../fundings/ItemWrapper";
import { BaseItemWrapper as UpdateItem } from "../../updates/ItemWrapper";
import { BaseItemWrapper as PoapItem } from "../../poaps/ItemWrapper";
import PlaceItem from "../../places/ItemWrapper";
import { EntityType, entityTypeToText } from "../../../libs/common";

interface Props {
    pubId?: string;
    type?: EntityType;
}

const EntityViewWrapper = (props: Props) => {

    if(!props.pubId || props.type === undefined) {
        return null;
    }

    switch(props.type) {
        case EntityType.CAMPAIGNS:
            return (
                <CampaignItem 
                    pubId={props.pubId}
                    showBody
                />
            );

        case EntityType.SIGNATURES:
            return (
                <SignatureItem 
                    pubId={props.pubId}
                />
            );
        
        case EntityType.UPDATES:
            return (
                <UpdateItem 
                    pubId={props.pubId}
                />
            );

        case EntityType.VOTES:
            return (
                <VoteItem 
                    pubId={props.pubId}
                />
            );

        case EntityType.DONATIONS:
            return (
                <DonationItem 
                    pubId={props.pubId}
                />
            );

        case EntityType.FUNDINGS:
            return (
                <FundingItem 
                    pubId={props.pubId}
                />
            );

        case EntityType.PLACES:
            return (
                <PlaceItem
                    pubId={props.pubId}
                />
            );

        case EntityType.POAPS:
            return (
                <PoapItem
                    pubId={props.pubId}
                />
            );

        case EntityType.USERS:
            return (
                <div></div>
            )

        default:
            return (
                <div></div>
            );
    }
};

const EntityViewContainer = (props: Props) => {
    return (
        <div>
            <div className="label">
                {props.type !== undefined && entityTypeToText(props.type)}
            </div>
            <div>
                <EntityViewWrapper
                    pubId={props.pubId}
                    type={props.type}
                />
            </div>
        </div>
    );
}


export default EntityViewContainer;