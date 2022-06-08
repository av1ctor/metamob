import React from "react";
import { Campaign } from "../../../../../declarations/metamob/metamob.did";
import { campaignStateToColor, campaignStateToText } from "../../../libs/campaigns"

interface Props {
    campaign: Campaign;
}

const State = (props: Props) => {
    const {campaign} = props;

    return (
        <span 
            className={`tag is-rounded is-${campaignStateToColor(campaign.state)}`}
        >
            {campaignStateToText(campaign.state).toLowerCase()}
        </span>
    );
};

export default State;