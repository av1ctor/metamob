import React from "react";
import { Link } from "react-router-dom";
import { useFindCampaignById } from "../../../hooks/campaigns";
import Avatar from "../../users/Avatar";

interface Props {
    id: number;
    partial?: boolean;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    
    const campaign = useFindCampaignById(props.id);

    return (
        <div className="mb-2">
            {campaign.data?
                props.partial?
                    <div>
                        <b>Campaign</b>:&nbsp;
                        <Link 
                            to={`/c/${campaign.data.pubId}`}
                            target="_blank"
                        >
                            {campaign.data.pubId} <i className="la la-external-link-alt" />
                        </Link>
                    </div>
                :
                    <div className="field">
                        <label className="label">
                            Campaign
                        </label>
                        <div className="control preview-box">
                            <div>
                                <label className="label mb-0 pb-0">
                                    Id
                                </label>
                                <Link 
                                    to={`/c/${campaign.data.pubId}`}
                                    target="_blank"
                                >
                                    {campaign.data.pubId} <i className="la la-external-link-alt" />
                                </Link>
                            </div>
                            <div>
                                <label className="label">
                                    Title
                                </label>
                                {campaign.data.title}
                            </div>
                            <div>
                                <label className="label">
                                    Body
                                </label>
                                {limitText(campaign.data.body, 60)}
                            </div>
                            <div>
                                <label className="label mb-0 pb-0">
                                    Author
                                </label>
                                <Avatar 
                                    id={campaign.data.createdBy} 
                                    size='lg'
                                />
                            </div>
                        </div>
                    </div>
                :
                    null
            }
        </div>
    );
};