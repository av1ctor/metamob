import React, { useContext } from "react";
import Box from "../../../../../components/Box";
import { CampaignState, getAgainstVotes, getProVotes } from "../../../../../libs/campaigns";
import { useFindVoteByCampaignAndUser } from "../../../../../hooks/votes";
import { Campaign } from "../../../../../../../declarations/metamob/metamob.did";
import { AuthContext } from "../../../../../stores/auth";
import VoteForm from "./Form";
import Result from "../../Result";
import Share from "../../Share";
import Boost from "../../Boost";

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
    const totalVotes = proVotes + againstVotes;
    
    const userVote = useFindVoteByCampaignAndUser(campaign?._id, auth.user?._id);
   
    return (
        <>
            <div className="voting">
                <progress className="progress voting mb-0 pb-0 is-success" value={Number(proVotes)} max={Number(totalVotes)}>{proVotes.toString()}</progress>
            </div>
            <div><small><b>{proVotes.toString()}</b> in favor/<b>{againstVotes.toString()}</b> against of {totalVotes.toString()} votes in total.</small></div>
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