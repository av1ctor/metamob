import React, { useContext } from "react";
import { Profile } from "../../../../../declarations/metamob/metamob.did";
import { useFindDonationById } from "../../../hooks/donations";
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
    
    const donation = useFindDonationById(props.id, actorState.main);
    
    return (
        <div className="mb-2">
            {donation.data && 
                <div className="field">
                    <label className="label">
                        Donation
                    </label>
                    <div className="control preview-box">
                        <div>
                            <label className="label">
                                Id
                            </label>
                            {donation.data.pubId}
                        </div>
                        <div>
                            <label className="label">
                                Value
                            </label>
                            {donation.data.value.toString()}
                        </div>
                        <div>
                            <label className="label">
                                Message
                            </label>
                            {limitText(donation.data.body, 60)}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={donation.data.createdBy} 
                                size='lg'
                                onClick={props.onEditUser}
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={donation.data.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};