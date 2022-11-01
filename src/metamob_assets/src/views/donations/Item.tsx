import React, { useCallback, useContext } from "react";
import {Campaign, ProfileResponse, DonationResponse} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { DonationState } from "../../libs/donations";
import { icpToDecimal } from "../../libs/icp";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";
import { Markdown } from "../../components/Markdown";
import ModerationBadge from "../moderations/moderation/Badge";
import { FormattedMessage } from "react-intl";

interface BaseItemProps {
    donation: DonationResponse;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (donation: DonationResponse) => void;
};

export const BaseItem = (props: BaseItemProps) => {
    const donation = props.donation;

    const handleShowModerations = useCallback(() => {
        if(props.onShowModerations) {
            props.onShowModerations(props.donation);
        }
    }, [props.donation, props.onShowModerations]);

    return (
        <article className="media">
            {props.user && 
                <div className="media-left">
                    <div className="flex-node w-12">
                        <Avatar id={props.user._id} size='lg' noName={true} />
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
                        <FormattedMessage id="Value" defaultMessage="Value"/>:&nbsp;
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
                    </div>
                    <div>
                        <ModerationBadge
                            reason={donation.moderated}
                            onShowModerations={handleShowModerations} 
                        />
                    </div>
                    <Markdown
                        className="update-body" 
                        body={donation.body || '\n&nbsp;\n'}
                    />
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign?: Campaign;
    donation: DonationResponse;
    onEdit: (donation: DonationResponse) => void;
    onDelete: (donation: DonationResponse) => void;
    onReport: (donation: DonationResponse) => void;
    onShowModerations?: (donation: DonationResponse) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
    const {donation} = props;

    const creatorReq = useFindUserById(donation.createdBy);

    const creator = donation.createdBy && donation.createdBy.length > 0?
        donation.createdBy[0] || 0:
        0;

    const canEdit = (props.campaign?.state === CampaignState.PUBLISHED && 
        auth.user && (auth.user._id === creator && creator !== 0));

    return (
        <BaseItem
            user={creatorReq.data}
            donation={donation}
            onShowModerations={props.onShowModerations}
        >
            <p>
                <small>
                    {canEdit && 
                        <>
                            <a
                                title="Edit donation"
                                onClick={() => props.onEdit(donation)}
                            >
                                <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                            </a>
                            &nbsp;·&nbsp;
                            <a
                                title="Delete donation"
                                onClick={() => props.onDelete(donation)}
                            >
                                <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> <FormattedMessage id="Delete" defaultMessage="Delete"/></span>
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
                                <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> <FormattedMessage id="Report" defaultMessage="Report"/></span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    <TimeFromNow 
                        date={BigInt.asIntN(64, donation.createdAt)}
                    />
                    {donation.updatedBy && donation.updatedBy.length > 0 &&
                        <>
                            &nbsp;·&nbsp;<b><i><FormattedMessage id="Edited" defaultMessage="Edited"/></i></b>
                        </>
                    }
                </small>
            </p>
        </BaseItem>
    );
};
