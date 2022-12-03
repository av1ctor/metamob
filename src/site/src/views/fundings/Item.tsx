import React, { useCallback, useEffect, useState } from "react";
import {Campaign, ProfileResponse, FundingResponse} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState, findById } from "../../libs/campaigns";
import { FundingState } from "../../libs/fundings";
import { e8sToDecimal } from "../../libs/icp";
import Avatar from "../users/Avatar";
import { Markdown } from "../../components/Markdown";
import ModerationBadge from "../moderations/moderation/Badge";
import { useAuth } from "../../hooks/auth";

interface BaseItemProps {
    user?: ProfileResponse;
    campaign?: Campaign;
    funding: FundingResponse;
    children?: any;
    onShowModerations?: (funding: FundingResponse) => void;
};

export const BaseItem = (props: BaseItemProps) => {
    
    const funding = props.funding;
    const [campaign, setCampaign] = useState(props.campaign);

    const loadCampaign = async () => {
        if(!props.campaign) {
            const campaign = await findById(funding.campaignId);
            setCampaign(campaign);
        }
    }

    const handleShowModerations = useCallback(() => {
        if(props.onShowModerations) {
            props.onShowModerations(props.funding);
        }
    }, [props.funding, props.onShowModerations]);

    useEffect(() => {
        loadCampaign();
    }, [props.funding.campaignId]);

    const tiers = campaign && 'funding' in campaign.info?
        campaign.info.funding.tiers:
        [];

    return (
        <article className="media">
            {props.user &&
                <div className="media-left">
                    <div className="flex-node w-12">
                        <Avatar 
                            id={props.user._id} 
                            size='lg' 
                            noName={true} 
                        />
                    </div>
                </div>
            }
            <div className="media-content">
                <div className="content">
                    {props.user &&
                        <div>
                            <strong>{props.user?.name}</strong>
                        </div>
                    }
                    <div>
                        Tier:&nbsp;<strong>{props.funding.tier} - "{tiers.length > 0? tiers[props.funding.tier].title: ''}"</strong>
                    </div>
                    <div>
                        Value:&nbsp;
                        <span 
                            className={`${props.funding.state === FundingState.COMPLETED? 'has-text-success': 'has-text-danger'}`}
                        >
                            {e8sToDecimal(props.funding.value)} ICP&nbsp;
                            {props.funding.state === FundingState.COMPLETED? 
                                <i className="la la-check-circle" title="Completed!" />
                            :  
                                <i className="la la-times-circle" title="Ongoing..." />
                            }
                        </span>
                    </div>
                    <div>
                        <ModerationBadge
                            reason={funding.moderated}
                            onShowModerations={handleShowModerations} 
                        />
                    </div>
                    <Markdown
                        className="update-body" 
                        body={funding.body || '\n&nbsp;\n'}
                    />
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign?: Campaign;
    funding: FundingResponse;
    onEdit: (funding: FundingResponse) => void;
    onDelete: (funding: FundingResponse) => void;
    onReport: (funding: FundingResponse) => void;
    onShowModerations?: (funding: FundingResponse) => void;
};

export const Item = (props: ItemProps) => {
    const {user} = useAuth()
    
    const {funding} = props;

    const author = useFindUserById(funding.createdBy);

    const authorId = funding.createdBy && funding.createdBy.length > 0?
        funding.createdBy[0] || 0:
        0;

    const canEdit = (props.campaign?.state === CampaignState.PUBLISHED && 
        user && (user._id === authorId && authorId !== 0));

    return (
        <BaseItem
            user={author.data}
            campaign={props.campaign}
            funding={funding}
            onShowModerations={props.onShowModerations}
        >
            <p>
                <small>
                    {canEdit && 
                        <>
                            <a
                                title="Edit funding"
                                onClick={() => props.onEdit(funding)}
                            >
                                <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                            </a>
                            &nbsp;·&nbsp;
                            <a
                                title="Delete funding"
                                onClick={() => props.onDelete(funding)}
                            >
                                <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    {user && 
                        <>
                            <a
                                title="Report funding"
                                onClick={() => props.onReport(funding)}
                            >
                                <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> Report</span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    <TimeFromNow 
                        date={BigInt.asIntN(64, funding.createdAt)}
                    />
                    {funding.updatedBy && funding.updatedBy.length > 0 &&
                        <>
                            &nbsp;·&nbsp;<b><i>Edited</i></b>
                        </>
                    }
                </small>
            </p>
        </BaseItem>
    );
};
