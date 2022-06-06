import React, { useContext } from "react";
import ReactMarkdown from "react-markdown";
import {Campaign, ProfileResponse, FundingResponse} from "../../../../declarations/dchanges/dchanges.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { FundingState } from "../../libs/fundings";
import { isModerator } from "../../libs/users";
import { icpToDecimal } from "../../libs/icp";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";

interface BaseItemProps {
    funding: FundingResponse;
    user?: ProfileResponse;
    children?: any;
};

export const BaseItem = (props: BaseItemProps) => {
    const funding = props.funding;

    return (
        <article className="media">
            <div className="media-left">
                <div className="flex-node w-12">
                    {props.user &&
                        <Avatar id={props.user._id} size='lg' noName={true} />
                    }
                </div>
            </div>
            <div className="media-content">
                <div className="content">
                    <strong>{props.user?.name}</strong>
                    <br />
                    Value:&nbsp;
                    <span 
                        className={`${props.funding.state === FundingState.COMPLETED? 'has-text-success': 'has-text-danger'}`}
                    >
                        {icpToDecimal(props.funding.value)} ICP&nbsp;
                        {props.funding.state === FundingState.COMPLETED? 
                            <i className="la la-check-circle" title="Completed!" />
                        :  
                            <i className="la la-times-circle" title="Ongoing..." />
                        }
                    </span>
                    <br />
                    <ReactMarkdown className="update-body" children={funding.body}/>
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign: Campaign;
    funding: FundingResponse;
    onEdit: (funding: FundingResponse) => void;
    onDelete: (funding: FundingResponse) => void;
    onReport: (funding: FundingResponse) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
    const {funding} = props;

    const author = funding.createdBy && funding.createdBy.length > 0?
        funding.createdBy[0] || 0:
        0;

    const user = useFindUserById(author);

    const canEdit = (props.campaign.state === CampaignState.PUBLISHED && 
        auth.user && (auth.user._id === author && author !== 0)) ||
        (auth.user && isModerator(auth.user));

    return (
        <BaseItem
            user={user.data}
            funding={funding}
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
                    {auth.user && 
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
