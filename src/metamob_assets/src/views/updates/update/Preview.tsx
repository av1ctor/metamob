import React, { useContext } from "react";
import { useFindUpdateById } from "../../../hooks/updates";
import { ActorContext } from "../../../stores/actor";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

interface Props {
    id: number;
    partial?: boolean;
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
            {update.data?
                props.partial?
                    <div>
                        <b>Update at campaign</b>:&nbsp;
                        <CampaignLink id={update.data.campaignId} />
                    </div>
                :
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
            :
                null
            }
        </div>
    );
};