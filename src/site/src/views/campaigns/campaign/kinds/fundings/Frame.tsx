import React from "react";
import Box from "../../../../../components/Box";
import { CampaignState } from "../../../../../libs/campaigns";
import { Campaign } from "../../../../../../../declarations/metamob/metamob.did";
import FundingForm from "./Form";
import { e8sToDecimal } from "../../../../../libs/icp";
import { FormattedMessage } from "react-intl";
import Action from "../Action";

interface Props {
    campaign: Campaign;
}

export const FundingFrame = (props: Props) => {
    const {campaign} = props;
    
    const funded = campaign.total;

    return (
        <>
            <progress className="progress mb-0 pb-0 is-success" value={Number(funded / 100000000n)} max={Number(campaign.goal / 100000000n)}>{funded.toString()}</progress>
            <div>
                <small>
                    <b>{e8sToDecimal(funded, 2)} ICP</b> <FormattedMessage defaultMessage="funded"/>.&nbsp;
                    {campaign.state === CampaignState.PUBLISHED?
                        <span><FormattedMessage defaultMessage="More"/> <b>{e8sToDecimal(campaign.goal - funded, 2)} ICP</b> <FormattedMessage defaultMessage="to goal. Keep going!"/></span>
                    :
                        <FormattedMessage defaultMessage="Thank you to all fundraisers!"/>
                    }
                </small>
            </div>
            <Action campaign={campaign} />
            <br/>
            {(campaign.state === CampaignState.PUBLISHED || campaign.state === CampaignState.BUILDING) &&
                <Box>
                    <div className="is-size-4">
                        <FormattedMessage id="To" defaultMessage="To"/>: <span className="is-size-4 has-text-link">{campaign.target}</span>
                    </div>
                    <FundingForm 
                        campaign={campaign}
                    />
                </Box>
            }
        </>
    );
};