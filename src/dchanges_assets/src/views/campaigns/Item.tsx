import React from "react";
import {Link} from 'react-router-dom';
import { Campaign } from "../../../../declarations/dchanges/dchanges.did";
import TimeFromNow from "../../components/TimeFromNow";
import Avatar from "../users/Avatar";
import Category from "../categories/category/Category";
import Tag from "../../components/Tag";
import Card from "../../components/Card";
import { CampaignKind, CampaignResult, CampaignState } from "../../libs/campaigns";
import PlaceTree from "../places/place/PlaceTree";
import { limitText } from "../../libs/utils";
import { icpToDecimal } from "../../libs/icp";

interface Props {
    campaign: Campaign
};

const Item = (props: Props) => {
    const campaign = props.campaign;

    const total = campaign.kind === CampaignKind.DONATIONS?
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
            <div className="level">
                <div className="level-left">
                    <span title="State">
                        {campaign.state === CampaignState.FINISHED? 
                            campaign.result === CampaignResult.WON?
                                <span className="tag is-rounded is-success">finished</span>
                            :
                                <span className="tag is-rounded is-danger">ended</span>
                        :
                        <span className="tag is-rounded is-light">published</span>
                        }
                    </span>
                    &nbsp;·&nbsp;
                    <span className="tag is-rounded is-success" title={`Total: ${total}`}>{total}</span>
                    {campaign.updatesCnt > 0 && <>&nbsp;·&nbsp;<span className="tag is-rounded is-warning" title={`Updates: ${campaign.updatesCnt}`}>{campaign.updatesCnt}</span></>}
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