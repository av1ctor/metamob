import React from "react";
import { Poap } from "../../../../../declarations/metamob/metamob.did";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

interface Props {
    poap: Poap;
    partial?: boolean;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const {poap} = props;
    
    return (
        <div className="mb-2">
            {props.partial?
                <div>
                    <b>Poap at campaign</b>:&nbsp;
                    <CampaignLink id={poap.campaignId} />
                </div>
            : 
                <div className="field">
                    <label className="label">
                        Poap
                    </label>
                    <div className="control preview-box">
                        <div>
                            <label className="label">
                                Name
                            </label>
                            {poap.name}
                        </div>
                        <div>
                            <label className="label">
                                Logo
                            </label>
                            <div className="poap-logo">
                                <img 
                                    className="preview"
                                    src={"data:image/svg+xml;utf8," + encodeURIComponent(poap.logo)} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={poap.createdBy} 
                                size='lg'
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={poap.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};