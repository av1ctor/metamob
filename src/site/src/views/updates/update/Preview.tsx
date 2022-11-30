import React from "react";
import { Update } from "../../../../../declarations/metamob/metamob.did";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

interface Props {
    update: Update;
    partial?: boolean;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const {update} = props;

    return (
        <div className="mb-2">
            {props.partial?
                <div>
                    <b>Update at campaign</b>:&nbsp;
                    <CampaignLink id={update.campaignId} />
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
                            {update.pubId}
                        </div>
                        <div>
                            <label className="label">
                                Message
                            </label>
                            {limitText(update.body, 60)}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={update.createdBy} 
                                size='lg'
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={update.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};