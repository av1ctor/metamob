import React, { useContext } from "react";
import Box from "../../../../components/Box";
import { CampaignState } from "../../../../libs/campaigns";
import { useFindSignatureByCampaignAndUser } from "../../../../hooks/signatures";
import { Campaign } from "../../../../../../declarations/dchanges/dchanges.did";
import { AuthContext } from "../../../../stores/auth";
import SignForm from "./SignForm";
import Result from "../Result";
import Share from "../Share";

const maxTb: number[] = [100, 500, 1000, 2500, 5000, 10000, 15000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 3000000, 4000000, 5000000, 10000000, 50000000, 100000000, 500000000, 1000000000, 10000000000];

const calcMaxSignatures = (signatures: number): number => {
    for(let i = 0; i < maxTb.length; i++) {
        if(signatures <= maxTb[i]) {
            return maxTb[i];
        }
    }

    return Number.MAX_SAFE_INTEGER;
}

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

export const SignFrame = (props: Props) => {
    const [auth] = useContext(AuthContext);
    
    const {campaign} = props;
    
    const signaturesCnt = campaign?.info?
        ('signatures' in campaign?.info && campaign?.info.signatures.total) || 0:
        0;
    
    const userSignature = useFindSignatureByCampaignAndUser(campaign?._id, auth.user?._id);

    const goal = calcMaxSignatures(signaturesCnt);
    
    return (
        <>
            <progress className="progress mb-0 pb-0 is-success" value={signaturesCnt} max={goal}>{signaturesCnt}</progress>
            <div><small><b>{signaturesCnt}</b> have signed. {campaign.state === CampaignState.PUBLISHED? <span>Let's get to {goal}!</span>: null}</small></div>
            <br/>
            {campaign.state === CampaignState.PUBLISHED? 
                <>
                    <Box>
                        <div className="is-size-4">
                            To: <span className="is-size-4 has-text-link">{campaign.target}</span>
                        </div>
                        <SignForm 
                            campaign={campaign}
                            signature={userSignature?.data} 
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