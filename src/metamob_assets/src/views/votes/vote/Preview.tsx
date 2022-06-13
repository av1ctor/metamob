import React, { useContext } from "react";
import { Profile } from "../../../../../declarations/metamob/metamob.did";
import { useFindVoteById } from "../../../hooks/votes";
import { ActorContext } from "../../../stores/actor";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";
import { Badge } from "./Badge";

interface Props {
    id: number;
    onEditUser?: (user: Profile) => void;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const vote = useFindVoteById(props.id, actorState.main);
    
    return (
        <div className="mb-2">
            {vote.data && 
                <div className="field">
                    <label className="label">
                        Vote
                    </label>
                    <div className="control preview-box">
                        <div>
                            <label className="label">
                                Id
                            </label>
                            {vote.data.pubId}
                        </div>
                        <div>
                            <label className="label">
                                Value
                            </label>
                            <Badge pro={vote.data.pro} />
                        </div>
                        <div>
                            <label className="label">
                                Message
                            </label>
                            {limitText(vote.data.body, 60)}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={vote.data.createdBy} 
                                size='lg'
                                onClick={props.onEditUser}
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={vote.data.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};