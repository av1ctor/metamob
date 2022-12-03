import React from "react";
import Box from "../../../../../components/Box";
import { CampaignState, getAgainstVotes, getProVotes } from "../../../../../libs/campaigns";
import { useFindVoteByCampaignAndUser } from "../../../../../hooks/votes";
import { Campaign } from "../../../../../../../declarations/metamob/metamob.did";
import VoteForm from "./Form";
import { FormattedMessage } from "react-intl";
import Action from "../Action";
import { useAuth } from "../../../../../hooks/auth";

interface Props {
    campaign: Campaign;
}

export const VoteFrame = (props: Props) => {
    const {user} = useAuth();
    
    const {campaign} = props;
    
    const proVotes = getProVotes(campaign);
    const againstVotes = getAgainstVotes(campaign);
    const totalVotes = proVotes + againstVotes;
    
    const userVote = useFindVoteByCampaignAndUser(campaign?._id, user?._id);
   
    return (
        <>
            <div className="voting">
                <progress className="progress voting mb-0 pb-0 is-success" value={Number(proVotes)} max={Number(totalVotes)}>{proVotes.toString()}</progress>
            </div>
            <div>
                <small>
                    <b>{proVotes.toString()}</b> <FormattedMessage defaultMessage="in favor"/>/<b>{againstVotes.toString()}</b> <FormattedMessage defaultMessage="against of"/> {totalVotes.toString()} votes in total.
                </small>
            </div>
            <Action campaign={campaign} />
            <br/>
            {campaign.state === CampaignState.PUBLISHED &&
                <Box>
                    <div className="is-size-4">
                        <FormattedMessage id="To" defaultMessage="To"/>: <span className="is-size-4 has-text-link">{campaign.target}</span>
                    </div>
                    <VoteForm 
                        campaign={campaign}
                        vote={userVote?.data} 
                    />
                </Box>
            }
        </>
    );
};