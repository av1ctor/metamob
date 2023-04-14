import React from "react";
import Box from "../../../../../components/Box";
import { CampaignState, getVotes } from "../../../../../libs/campaigns";
import { useFindVoteByCampaignAndUser } from "../../../../../hooks/votes";
import { Campaign, Place } from "../../../../../../../declarations/metamob/metamob.did";
import VoteForm from "./Form";
import { FormattedMessage } from "react-intl";
import Action from "../Action";
import { useAuth } from "../../../../../hooks/auth";

interface Props {
    place?: Place;
    campaign: Campaign;
}

export const VoteFrame = (props: Props) => {
    const {user} = useAuth();
    
    const {campaign} = props;
    
    const votes = getVotes(campaign, props.place);
    
    const userVote = useFindVoteByCampaignAndUser(campaign?._id, user?._id);
   
    return (
        <>
            <div className="voting">
                <progress className="progress voting mb-0 pb-0 is-success" value={Number(votes.pro.num)} max={Number(votes.goal.num)}>{votes.pro.str}</progress>
            </div>
            <div>
                <small>
                    <b>{votes.pro.str}</b> <FormattedMessage defaultMessage="in favor"/>/<b>{votes.against.str}</b> <FormattedMessage defaultMessage="against of"/> {votes.total.str} votes in total. Goal: {votes.goal.str}
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