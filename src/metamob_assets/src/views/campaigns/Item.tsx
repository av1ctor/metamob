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

interface Props {
    campaign: Campaign,
    isPreview?: boolean,
};

const Item = (props: Props) => {
    const campaign = props.campaign;

    const total = campaign.kind === CampaignKind.DONATIONS || campaign.kind === CampaignKind.FUNDINGS?
        icpToDecimal(campaign.total):
        campaign.total.toString();

    return (
        <Card 
            title={
                <Link to={`/c/${campaign.pubId}`}>{limitText(campaign.title, 45)}</Link>
            } 
            subtitle={<>
                <div className="mb-1">
                    <PlaceTree id={campaign.placeId} />
                </div>
                <div>
                    <Category id={campaign.categoryId} />
                    {campaign.tags.map(id => <Tag key={id} id={id} />)}
                </div>
            </>}
            img={
                <Link to={`/c/${campaign.pubId}`}><img src={campaign.cover}/></Link>
            }
        >
            {props.isPreview &&
                <div className="mb-5">
                    {limitText(campaign.body, 200)}
                </div>
            }
            <div className="level">
                <div className="level-left">
                    <span title="State">
                        <State 
                            campaign={campaign} 
                        />
                    </span>
                    &nbsp;·&nbsp;
                    <span className="tag is-rounded is-light is-success" title={`${campaignKindToTitle(campaign.kind)}: ${total}`}>
                        {total}&nbsp;<i className={`la la-${campaignKindToIcon(campaign.kind)}`} />
                    </span>
                    {campaign.updates > 0 && 
                        <>
                            &nbsp;·&nbsp;
                            <span className="tag is-rounded is-light is-warning" title={`Updates: ${campaign.updates}`}>
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