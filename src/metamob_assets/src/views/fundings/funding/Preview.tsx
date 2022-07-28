import React from "react";
import { Funding } from "../../../../../declarations/metamob/metamob.did";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

interface Props {
    funding: Funding;
    partial?: boolean;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const {funding} = props;

    return (
        <div className="mb-2">
            {props.partial?
                <div>
                    <b>Fundraising at campaign</b>:&nbsp;
                    <CampaignLink id={funding.campaignId} />
                </div>
            :
                <div className="field">
                    <label className="label">
                        Funding
                    </label>
                    <div className="control preview-box">
                        <div>
                            <label className="label">
                                Id
                            </label>
                            {funding.pubId}
                        </div>
                        <div>
                            <label className="label">
                                Value
                            </label>
                            {funding.value.toString()}
                        </div>
                        <div>
                            <label className="label">
                                Message
                            </label>
                            {limitText(funding.body, 60)}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={funding.createdBy} 
                                size='lg'
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={funding.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};