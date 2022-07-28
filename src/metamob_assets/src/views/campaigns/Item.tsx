import React from "react";
import {Link} from 'react-router-dom';
import { Campaign } from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import Avatar from "../users/Avatar";
import Category from "../categories/category/Category";
import Tag from "../../components/Tag";
import Card from "../../components/Card";
import { CampaignKind, campaignKindToIcon, campaignKindToTitle } from "../../libs/campaigns";
import State from "./campaign/State";
import PlaceTree from "../places/place/PlaceTree";
import { limitText } from "../../libs/utils";
import { icpToDecimal } from "../../libs/icp";
import Badge from "../../components/Badge";
import { Markdown } from "../../components/Markdown";
import ModerationBadge from "../moderations/moderation/Badge";

interface Props {
    campaign: Campaign;
    isPreview?: boolean;
    showBody?: boolean;
};

const Item = (props: Props) => {
    const campaign = props.campaign;

    const total = campaign.kind === CampaignKind.DONATIONS || campaign.kind === CampaignKind.FUNDINGS?
        icpToDecimal(campaign.total, 2):
        campaign.total.toString();

    return (
        <Card 
            title={
                <>
                    <Link to={`/c/${campaign.pubId}`}>
                        {limitText(campaign.title, 45)}
                    </Link>                    
                </>
            } 
            subtitle={<>
                <div className="mb-1">
                    <PlaceTree 
                        id={campaign.placeId} 
                    />
                </div>
                <div>
                    <Category 
                        id={campaign.categoryId} 
                    />
                    {campaign.tags.length > 0 &&
                        <span>&nbsp;·&nbsp;
                            {campaign.tags.map(id => 
                                <Tag key={id} id={id} />
                            )}
                        </span>
                    }
                </div>
            </>}
            img={
                <img src={campaign.cover}/>
            }
        >
            {props.showBody?
                <>
                    <div className="has-text-right">
                        <ModerationBadge 
                            reason={campaign.moderated}
                        />
                    </div>
                    <Markdown body={campaign.body} />
                </>
            :
                props.isPreview?
                    <div className="mb-5">
                        {limitText(campaign.body, 200)}
                    </div>
                :
                    null
            }
            <div className="level">
                <div className="level-left">
                    <span title="State">
                        <State 
                            campaign={campaign} 
                        />
                    </span>
                    {campaign.boosting > 0n && 
                        <span>&nbsp;·&nbsp;<Badge color="primary is-light"><i className="la la-rocket"/>&nbsp;promoted</Badge></span>
                    }
                    &nbsp;·&nbsp;
                    <span 
                        className="tag is-rounded is-light is-success" 
                        title={`${campaignKindToTitle(campaign.kind)}: ${total}`}
                    >
                        {total}&nbsp;<i className={`la la-${campaignKindToIcon(campaign.kind)}`} />
                    </span>
                    {campaign.updates > 0 && 
                        <>
                            &nbsp;·&nbsp;
                            <span 
                                className="tag is-rounded is-light is-warning" 
                                title={`Updates: ${campaign.updates}`}
                            >
                                {campaign.updates}&nbsp;<i className="la la-newspaper" />
                            </span>
                        </>}
                </div>
                <div className="level-right is-flex">
                    <Avatar id={campaign.createdBy} />&nbsp;·&nbsp;
                    <TimeFromNow 
                        date={BigInt.asIntN(64, campaign.createdAt)}
                    />
                </div>
            </div>
        </Card>
    );
};

export default Item;