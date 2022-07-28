import React from "react";
import { Link } from "react-router-dom";
import { Campaign } from "../../../../../declarations/metamob/metamob.did";
import Avatar from "../../users/Avatar";

interface Props {
    campaign: Campaign;
    partial?: boolean;
}

const limitText = (text: string, chars: number): string => {
    return text.length <= chars?
        text:
        `${text.substring(0, chars)}...`;
}

export const Preview = (props: Props) => {
    
    const {campaign} = props;

    return (
        <div className="mb-2">
            {props.partial?
                <div>
                    <b>Campaign</b>:&nbsp;
                    <Link 
                        to={`/c/${campaign.pubId}`}
                        target="_blank"
                    >
                        {campaign.pubId} <i className="la la-external-link-alt" />
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
                                to={`/c/${campaign.pubId}`}
                                target="_blank"
                            >
                                {campaign.pubId} <i className="la la-external-link-alt" />
                            </Link>
                        </div>
                        <div>
                            <label className="label">
                                Title
                            </label>
                            {campaign.title}
                        </div>
                        <div>
                            <label className="label">
                                Body
                            </label>
                            {limitText(campaign.body, 60)}
                        </div>
                        <div>
                            <label className="label mb-0 pb-0">
                                Author
                            </label>
                            <Avatar 
                                id={campaign.createdBy} 
                                size='lg'
                            />
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};