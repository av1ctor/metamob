import React from "react";
import { Link } from "react-router-dom";
import { useFindCampaignById } from "../../../hooks/campaigns";
import { limitText } from "../../../libs/utils";

interface Props {
    id: number;
}

export const CampaignLink = (props: Props) => {
    
    const campaign = useFindCampaignById(props.id);
    
    return (
        <>
            {campaign.data && 
                <Link 
                    to={`/c/${campaign.data.pubId}`}
                    target="_blank"
                >
                    {limitText(campaign.data.title, 40)} <i className="la la-external-link-alt" />
                </Link>
            }
        </>
    );
};