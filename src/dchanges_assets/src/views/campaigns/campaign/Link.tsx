import React from "react";
import { Link } from "react-router-dom";
import { useFindCampaignById } from "../../../hooks/campaigns";

interface Props {
    id: number;
}

export const CampaignLink = (props: Props) => {
    
    const campaign = useFindCampaignById(['campaigns', props.id], props.id);
    
    return (
        <div className="mb-2">
            {campaign.data && 
                <div className="field">
                    <label className="label">
                        Campaign
                    </label>
                    <div className="control">
                        <Link 
                            to={`/c/${campaign.data.pubId}`}
                            target="_blank"
                        >
                            {campaign.data.pubId} <i className="la la-external-link-alt" />
                        </Link>
                    </div>
                </div>
            }
        </div>
    );
};