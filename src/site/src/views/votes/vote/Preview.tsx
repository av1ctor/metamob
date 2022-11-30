import React from "react";
import { Vote } from "../../../../../declarations/metamob/metamob.did";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";
import { Badge } from "./Badge";

interface Props {
    vote: Vote;
    partial?: boolean;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    const {vote} = props;

    return (
        <div className="mb-2">
            {props.partial?
                <div>
                    <b>Vote at campaign</b>:&nbsp;
                    <CampaignLink id={vote.campaignId} />
                </div>
            :
                <div className="field">
                    <label className="label">
                        Vote
                    </label>
                    <div className="control preview-box">
                        <div>
                            <label className="label">
                                Id
                            </label>
                            {vote.pubId}
                        </div>
                        <div>
                            <label className="label">
                                Value
                            </label>
                            <Badge pro={vote.pro} />
                        </div>
                        <div>
                            <label className="label">
                                Message
                            </label>
                            {limitText(vote.body, 60)}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={vote.createdBy} 
                                size='lg'
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={vote.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};