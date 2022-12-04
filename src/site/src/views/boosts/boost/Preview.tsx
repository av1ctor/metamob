import React from "react";
import { Boost } from "../../../../../declarations/metamob/metamob.did";
import { CampaignLink } from "../../campaigns/campaign/Link";
import Avatar from "../../users/Avatar";

interface Props {
    boost: Boost;
    partial?: boolean;
}

export const Preview = (props: Props) => {
    const {boost} = props;
    
    return (
        <div className="mb-2">
            {props.partial?
                <div>
                    <b>Boost at campaign</b>:&nbsp;
                    <CampaignLink id={boost.campaignId} />
                </div>
            : 
                <div className="field">
                    <label className="label">
                        Boost
                    </label>
                    <div className="control preview-box">
                        <div>
                            <label className="label">
                                Id
                            </label>
                            {boost.pubId}
                        </div>
                        <div>
                            <label className="label">
                                Value
                            </label>
                            {boost.value.toString()}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={boost.createdBy} 
                                size='lg'
                            />
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Campaign
                            </label>
                            <CampaignLink id={boost.campaignId} />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};