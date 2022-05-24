import React, { useContext } from "react";
import Box from "../../../../components/Box";
import { CampaignState, getGoalValue } from "../../../../libs/campaigns";
import { useFindDonationByCampaignAndUser } from "../../../../hooks/donations";
import { Campaign } from "../../../../../../declarations/dchanges/dchanges.did";
import { AuthContext } from "../../../../stores/auth";
import DonationForm from "./DonationForm";
import Result from "../Result";
import Share from "../Share";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

export const DonationFrame = (props: Props) => {
    const [auth] = useContext(AuthContext);
    
    const {campaign} = props;
    
    const donated = ('donations' in campaign.info && campaign.info.donations.total) || BigInt(0);
    const goal = getGoalValue(campaign);

    const userDonation = useFindDonationByCampaignAndUser(campaign?._id, auth.user?._id);
   
    return (
        <>
            <div><small><b>{donated.toString()} ICP</b> donated. <b>{(goal - donated).toString()} ICP</b> to goal. Keep going!</small></div>
            <br/>
            {campaign.state === CampaignState.PUBLISHED? 
                <>
                    <Box>
                        <div className="is-size-4">
                            To: <span className="is-size-4 has-text-link">{campaign.target}</span>
                        </div>
                        <DonationForm 
                            campaign={campaign}
                            donation={userDonation?.data} 
                            onSuccess={props.onSuccess}
                            onError={props.onError}
                            toggleLoading={props.toggleLoading}
                        />
                    </Box>
                    <Box>
                        <Share
                            campaign={campaign}
                        />
                    </Box>
                </>
            :
                <Result result={campaign.result} />
            }
        </>
    );
};