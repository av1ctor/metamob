import React from "react";
import {Campaign, ProfileResponse, BoostResponse} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { BoostState } from "../../libs/boosts";
import { e8sToDecimal } from "../../libs/icp";
import Avatar from "../users/Avatar";
import { FormattedMessage } from "react-intl";
import { useAuth } from "../../hooks/auth";
import { currencyToString } from "../../libs/payment";

interface BaseItemProps {
    boost: BoostResponse;
    user?: ProfileResponse;
    children?: any;
};

export const BaseItem = (props: BaseItemProps) => {
    const boost = props.boost;

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
                            className={`${boost.state === BoostState.COMPLETED? 'has-text-success': 'has-text-danger'}`}
                        >
                            {e8sToDecimal(boost.value)} {currencyToString(boost.currency)}&nbsp;
                            {props.boost.state === BoostState.COMPLETED? 
                                <i className="la la-check-circle" title="Completed!" />
                            :  
                                <i className="la la-times-circle" title="Pending..." />
                            }
                        </span>
                    </div>
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign?: Campaign;
    boost: BoostResponse;
    onEdit: (boost: BoostResponse) => void;
};

export const Item = (props: ItemProps) => {
    const {user} = useAuth();
    
    const {boost} = props;

    const author = useFindUserById(boost.createdBy);

    const authorId = boost.createdBy && boost.createdBy.length > 0?
        boost.createdBy[0] || 0:
        0;

    const canEdit = (props.campaign?.state === CampaignState.PUBLISHED && 
        user && (user._id === authorId && authorId !== 0));

    return (
        <BaseItem
            user={author.data}
            boost={boost}
        >
            <p>
                <small>
                    {canEdit && 
                        <>
                            <a
                                title="Edit boost"
                                onClick={() => props.onEdit(boost)}
                            >
                                <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    <TimeFromNow 
                        date={BigInt.asIntN(64, boost.createdAt)}
                    />
                    {boost.updatedBy && boost.updatedBy.length > 0 &&
                        <>
                            &nbsp;·&nbsp;<b><i><FormattedMessage id="Edited" defaultMessage="Edited"/></i></b>
                        </>
                    }
                </small>
            </p>
        </BaseItem>
    );
};
