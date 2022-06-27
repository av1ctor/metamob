import React, { useContext } from "react";
import { Profile } from "../../../../../declarations/metamob/metamob.did";
import { useFindSignatureById } from "../../../hooks/signatures";
import { ActorContext } from "../../../stores/actor";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

interface Props {
    id: number;
    partial?: boolean;
    onEditUser?: (user: Profile) => void;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const signature = useFindSignatureById(props.id, actorState.main);
    
    return (
        <div className="mb-2">
            {signature.data?
                props.partial?
                    <div>
                        <b>Signature at campaign</b>:&nbsp;
                        <CampaignLink id={signature.data.campaignId} />
                    </div>
                :
                    <div className="field">
                        <label className="label">
                            Signature
                        </label>
                        <div className="control preview-box">
                            <div>
                                <label className="label">
                                    Id
                                </label>
                                {signature.data.pubId}
                            </div>
                            <div>
                                <label className="label">
                                    Message
                                </label>
                                {limitText(signature.data.body, 60)}
                            </div>
                            <div>
                                <label className="label mb-0 pb-0">
                                    Author
                                </label>
                                <Avatar 
                                    id={signature.data.createdBy} 
                                    size='lg'
                                    onClick={props.onEditUser}
                                />
                            </div>
                            <div>
                                <label className="label mb-0 pb-0">
                                    Campaign
                                </label>
                                <CampaignLink id={signature.data.campaignId} />
                            </div>
                        </div>
                    </div>
                :
                    null
            }
        </div>
    );
};