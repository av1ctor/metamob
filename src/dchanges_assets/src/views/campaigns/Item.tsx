import React from "react";
import {Link} from 'react-router-dom';
import { Campaign } from "../../../../declarations/dchanges/dchanges.did";
import TimeFromNow from "../../components/TimeFromNow";
import Avatar from "../users/Avatar";
import Category from "../categories/Category";
import Tag from "../tags/Tag";
import Card from "../../components/Card";
import { CampaignResult, CampaignState } from "../../libs/campaigns";

interface Props {
    campaign: Campaign
};

const buildSignature = (campaign: Campaign): number[] => {
    if(campaign.signaturesCnt > 0) {
        let res = new Set([campaign.createdBy]);
        campaign.signaturers.forEach(id => res.add(id));
        return Array.from(res);
    }
    else {
        return [campaign.createdBy];
    }
};

const Item = (props: Props) => {
    const campaign = props.campaign;

    return (
        <Card 
            title={
                <Link to={`/p/${campaign.pubId}`}>{campaign.title}</Link>
            } 
            subtitle={<>
                <Category id={campaign.categoryId} />
                {campaign.tags.map(id => <Tag key={id} id={id} />)}
            </>}
            img={
                <Link to={`/p/${campaign.pubId}`}><img src={campaign.cover || "1280x960.png"}/></Link>
            }
        >
            <div className="level">
                <div className="level-left">
                    {campaign.state === CampaignState.FINISHED? 
                        campaign.result === CampaignResult.WON?
                            <span className="tag is-rounded is-success">finished</span>
                        :
                            <span className="tag is-rounded is-danger">ended</span>
                    :
                    <span className="tag is-rounded is-light">published</span>
                    }
                    &nbsp;·&nbsp;
                    <span className="tag is-rounded is-success" title="Signatures">{campaign.signaturesCnt}</span>
                    {campaign.updatesCnt > 0 && <>&nbsp;·&nbsp;<span className="tag is-rounded is-warning" title="Updates">{campaign.updatesCnt}</span></>}
                </div>
                <div className="level-right">
                    <Avatar id={campaign.createdBy} />&nbsp;·&nbsp;
                    <TimeFromNow 
                        date={BigInt.asIntN(64, campaign.signaturesCnt > 0? campaign.lastSignatureAt[0] || 0n: campaign.createdAt)}
                    />
                </div>
            </div>
        </Card>
    );
};

export default Item;