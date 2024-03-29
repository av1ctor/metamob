import React from "react";
import Box from "../../../../../components/Box";
import { CampaignState } from "../../../../../libs/campaigns";
import { useFindSignatureByCampaignAndUser } from "../../../../../hooks/signatures";
import { Campaign } from "../../../../../../../declarations/metamob/metamob.did";
import SignForm from "./Form";
import { FormattedMessage } from "react-intl";
import Action from "../Action";
import { useAuth } from "../../../../../hooks/auth";

const maxTb: number[] = [100, 500, 1000, 2500, 5000, 10000, 15000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 3000000, 4000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1000000000, 10000000000];

const calcMaxSignatures = (
    signatures: number
): number => {
    for(let i = 0; i < maxTb.length; i++) {
        if(signatures <= maxTb[i]) {
            return maxTb[i];
        }
    }

    return Number.MAX_SAFE_INTEGER;
}

interface Props {
    campaign: Campaign;

}

export const SignFrame = (props: Props) => {
    const {user} = useAuth();
    
    const {campaign} = props;
    
    const total = Number(campaign.total);
    
    const userSignature = useFindSignatureByCampaignAndUser(campaign?._id, user?._id);

    const goal = campaign.goal === 0n? 
        calcMaxSignatures(total):
        Number(campaign.goal);
    
    return (
        <>
            <progress className="progress mb-0 pb-0 is-success" value={total} max={goal}>{total}</progress>
            <div>
                <small>
                    <b>{total}</b> <FormattedMessage defaultMessage="have signed."/>&nbsp;
                    {campaign.state === CampaignState.PUBLISHED? 
                        <span><FormattedMessage defaultMessage="Let's get to"/> {goal}!</span>
                    : 
                        <FormattedMessage defaultMessage="Thank you to all signers!"/>
                    }
                </small>
            </div>
            <Action campaign={campaign} />
            <br/>
            {campaign.state === CampaignState.PUBLISHED &&
                <Box>
                    <div className="is-size-4">
                        <FormattedMessage id="To" defaultMessage="To"/>: <span className="is-size-4 has-text-link">{campaign.target}</span>
                    </div>
                    <SignForm 
                        campaign={campaign}
                        signature={userSignature?.data} 
                    />
                </Box>
            }
        </>
    );
};