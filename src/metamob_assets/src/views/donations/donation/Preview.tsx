import React from "react";
import { Donation } from "../../../../../declarations/metamob/metamob.did";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

interface Props {
    donation: Donation;
    partial?: boolean;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const {donation} = props;
    
    return (
        <div className="mb-2">
            {props.partial?
                <div>
                    <b>Donation at campaign</b>:&nbsp;
                    <CampaignLink id={donation.campaignId} />
                </div>
            : 
                <div className="field">
                    <label className="label">
                        Donation
                    </label>
                    <div className="control preview-box">
                        <div>
                            <label className="label">
                                Id
                            </label>
                            {donation.pubId}
                        </div>
                        <div>
                            <label className="label">
                                Value
                            </label>
                            {donation.value.toString()}
                        </div>
                        <div>
                            <label className="label">
                                Message
                            </label>
                            {limitText(donation.body, 60)}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={donation.createdBy} 
                                size='lg'
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={donation.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};