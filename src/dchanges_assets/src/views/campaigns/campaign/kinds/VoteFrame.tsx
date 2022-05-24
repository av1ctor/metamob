import React, { useContext } from "react";
import Box from "../../../../components/Box";
import { CampaignState, getAgainstVotes, getGoalValue, getProVotes } from "../../../../libs/campaigns";
import { useFindVoteByCampaignAndUser } from "../../../../hooks/votes";
import { Campaign } from "../../../../../../declarations/dchanges/dchanges.did";
import { AuthContext } from "../../../../stores/auth";
import VoteForm from "./VoteForm";
import Result from "../Result";
import Share from "../Share";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

export const VoteFrame = (props: Props) => {
    const [auth] = useContext(AuthContext);
    
    const {campaign} = props;
    
    const proVotes = getProVotes(campaign);
    const againstVotes = getAgainstVotes(campaign);
    
    const userVote = useFindVoteByCampaignAndUser(campaign?._id, auth.user?._id);
   
    return (
        <>
            <div><small><b>{proVotes.toString()}</b> pro/<b>{againstVotes.toString()}</b> against votes.</small></div>
            <br/>
            {campaign.state === CampaignState.PUBLISHED? 
                <>
                    <Box>
                        <div className="is-size-4">
                            To: <span className="is-size-4 has-text-link">{campaign.target}</span>
                        </div>
                        <VoteForm 
                            campaign={campaign}
                            vote={userVote?.data} 
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