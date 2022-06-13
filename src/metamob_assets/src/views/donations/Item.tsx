import React, { useContext } from "react";
import {Campaign, ProfileResponse, DonationResponse} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { DonationState } from "../../libs/donations";
import { isModerator } from "../../libs/users";
import { icpToDecimal } from "../../libs/icp";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";
import { Markdown } from "../../components/Markdown";

interface BaseItemProps {
    donation: DonationResponse;
    user?: ProfileResponse;
    children?: any;
};

export const BaseItem = (props: BaseItemProps) => {
    const donation = props.donation;

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
                        className={`${props.donation.state === DonationState.COMPLETED? 'has-text-success': 'has-text-danger'}`}
                    >
                        {icpToDecimal(props.donation.value)} ICP&nbsp;
                        {props.donation.state === DonationState.COMPLETED? 
                            <i className="la la-check-circle" title="Completed!" />
                        :  
                            <i className="la la-times-circle" title="Ongoing..." />
                        }
                    </span>
                    <br />
                    <Markdown
                        className="update-body" 
                        body={donation.body}
                    />
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign: Campaign;
    donation: DonationResponse;
    onEdit: (donation: DonationResponse) => void;
    onDelete: (donation: DonationResponse) => void;
    onReport: (donation: DonationResponse) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
    const {donation} = props;

    const author = donation.createdBy && donation.createdBy.length > 0?
        donation.createdBy[0] || 0:
        0;

    const user = useFindUserById(author);

    const canEdit = (props.campaign.state === CampaignState.PUBLISHED && 
        auth.user && (auth.user._id === author && author !== 0)) ||
        (auth.user && isModerator(auth.user));

    return (
        <BaseItem
            user={user.data}
            donation={donation}
        >
            <p>
                <small>
                    {canEdit && 
                        <>
                            <a
                                title="Edit donation"
                                onClick={() => props.onEdit(donation)}
                            >
                                <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                            </a>
                            &nbsp;·&nbsp;
                            <a
                                title="Delete donation"
                                onClick={() => props.onDelete(donation)}
                            >
                                <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    {auth.user && 
                        <>
                            <a
                                title="Report donation"
                                onClick={() => props.onReport(donation)}
                            >
                                <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> Report</span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    <TimeFromNow 
                        date={BigInt.asIntN(64, donation.createdAt)}
                    />
                    {donation.updatedBy && donation.updatedBy.length > 0 &&
                        <>
                            &nbsp;·&nbsp;<b><i>Edited</i></b>
                        </>
                    }
                </small>
            </p>
        </BaseItem>
    );
};
