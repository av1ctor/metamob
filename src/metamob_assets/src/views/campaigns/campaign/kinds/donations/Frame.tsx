import React from "react";
import Box from "../../../../../components/Box";
import { CampaignState } from "../../../../../libs/campaigns";
import { Campaign } from "../../../../../../../declarations/metamob/metamob.did";
import DonationForm from "./Form";
import { icpToDecimal } from "../../../../../libs/icp";
import { FormattedMessage } from "react-intl";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

export const DonationFrame = (props: Props) => {
    const {campaign} = props;
    
    const donated = campaign.total;

    return (
        <>
            <progress className="progress mb-0 pb-0 is-success" value={Number(donated / 100000000n)} max={Number(campaign.goal / 100000000n)}>{donated.toString()}</progress>
            <div><small><b>{icpToDecimal(donated, 2)} ICP</b> <FormattedMessage defaultMessage="donated"/>. <FormattedMessage defaultMessage="More"/> <b>{icpToDecimal(campaign.goal - donated, 2)} ICP</b> <FormattedMessage defaultMessage="to goal. Keep going!"/></small></div>
            <br/>
            {campaign.state === CampaignState.PUBLISHED &&
                <Box>
                    <div className="is-size-4">
                        <FormattedMessage id="To" defaultMessage="To"/>: <span className="is-size-4 has-text-link">{campaign.target}</span>
                    </div>
                    <DonationForm 
                        campaign={campaign}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                </Box>
            }
        </>
    );
};