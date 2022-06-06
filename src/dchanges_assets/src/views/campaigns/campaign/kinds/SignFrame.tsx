import React, { useContext } from "react";
import Box from "../../../../components/Box";
import { CampaignState } from "../../../../libs/campaigns";
import { useFindSignatureByCampaignAndUser } from "../../../../hooks/signatures";
import { Campaign } from "../../../../../../declarations/dchanges/dchanges.did";
import { AuthContext } from "../../../../stores/auth";
import SignForm from "./SignForm";
import Result from "../Result";
import Share from "../Share";
import Boost from "../Boost";

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
    
    const total = Number(campaign.total);
    
    const userSignature = useFindSignatureByCampaignAndUser(campaign?._id, auth.user?._id);

    const goal = campaign.goal === 0n? 
        calcMaxSignatures(total):
        Number(campaign.goal);
    
    return (
        <>
            <progress className="progress mb-0 pb-0 is-success" value={total} max={goal}>{total}</progress>
            <div><small><b>{total}</b> have signed. {campaign.state === CampaignState.PUBLISHED? <span>Let's get to {goal}!</span>: null}</small></div>
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
                        <Boost 
                            campaign={campaign} 
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
                <Result 
                    campaign={campaign} 
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            }
        </>
    );
};