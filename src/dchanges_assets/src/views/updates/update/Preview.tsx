import React, { useContext } from "react";
import { Profile } from "../../../../../declarations/dchanges/dchanges.did";
import { useFindUpdateById } from "../../../hooks/updates";
import { ActorContext } from "../../../stores/actor";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

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
    
    const update = useFindUpdateById(props.id, actorState.main);
    
    return (
        <div className="mb-2">
            {update.data && 
                <div className="field">
                    <label className="label">
                        Update
                    </label>
                    <div className="control preview-box">
                        <div>
                            <label className="label">
                                Id
                            </label>
                            {update.data.pubId}
                        </div>
                        <div>
                            <label className="label">
                                Message
                            </label>
                            {limitText(update.data.body, 60)}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={update.data.createdBy} 
                                size='lg'
                                onClick={props.onEditUser}
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={update.data.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};