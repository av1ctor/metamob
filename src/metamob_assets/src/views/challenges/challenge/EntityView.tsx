import React from "react";
import CampaignItem from "../../campaigns/Item";
import { BaseItem as DonationItem } from "../../donations/Item";
import { BaseItem as SignatureItem } from "../../signatures/Item";
import { BaseItem as VoteItem } from "../../votes/Item";
import { BaseItem as FundingItem } from "../../fundings/Item";
import { BaseItem as UpdateItem } from "../../updates/Item";
import PlaceItem from "../../places/Item";
import { EntityType, entityTypeToText } from "../../../libs/common";

interface Props {
    entity: any;
    type?: EntityType;
}

const EntityView = (props: Props) => {

    if(!props.entity || props.type === undefined) {
        return null;
    }

    switch(props.type) {
        case EntityType.CAMPAIGNS:
            return (
                <CampaignItem 
                    campaign={props.entity}
                    showBody
                />
            );

        case EntityType.SIGNATURES:
            return (
                <SignatureItem 
                    signature={props.entity}
                />
            );
        
        case EntityType.UPDATES:
            return (
                <UpdateItem 
                    update={props.entity}
                />
            );

        case EntityType.VOTES:
            return (
                <VoteItem 
                    vote={props.entity}
                />
            );

        case EntityType.DONATIONS:
            return (
                <DonationItem 
                    donation={props.entity}
                />
            );

        case EntityType.FUNDINGS:
            return (
                <FundingItem 
                    funding={props.entity}
                />
            );

        case EntityType.PLACES:
            return (
                <PlaceItem
                    place={props.entity}
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
                <EntityView
                    entity={props.entity}
                    type={props.type}
                />
            </div>
        </div>
    );
}


export default EntityViewContainer;