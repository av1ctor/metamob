import React from "react";
import {Link} from 'react-router-dom';
import { Campaign } from "../../../../declarations/dchanges/dchanges.did";
import TimeFromNow from "../../components/TimeFromNow";
import Avatar from "../users/Avatar";
import Category from "../categories/Category";
import Tag from "../tags/Tag";
import Card from "../../components/Card";

interface Props {
    campaign: Campaign
};

const buildSignatureer = (campaign: Campaign): number[] => {
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
                <div className="flex-none w-16 p-4 border-b-2 text-center">
                    {buildSignatureer(campaign).map((id) => <Avatar key={id} id={id} />)}
                </div>
                <div className="flex-none w-16 p-4 border-b-2 text-center">
                    {campaign.signaturesCnt}
                </div>
                <div className="flex-none w-16 p-4 border-b-2 text-center">
                    <Link to={`/p/${campaign.pubId}`}>
                        <TimeFromNow 
                            date={BigInt.asIntN(64, campaign.signaturesCnt > 0? campaign.lastSignatureAt[0] || 0n: campaign.createdAt)}
                        />
                    </Link>
                </div>
            </div>
        </Card>
    );
};

export default Item;