import React from "react";
import { Signature } from "../../../../../declarations/metamob/metamob.did";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

interface Props {
    signature: Signature;
    partial?: boolean;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const {signature} = props;
    
    return (
        <div className="mb-2">
            {props.partial?
                <div>
                    <b>Signature at campaign</b>:&nbsp;
                    <CampaignLink id={signature.campaignId} />
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
                            {signature.pubId}
                        </div>
                        <div>
                            <label className="label">
                                Message
                            </label>
                            {limitText(signature.body, 60)}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={signature.createdBy} 
                                size='lg'
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={signature.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};