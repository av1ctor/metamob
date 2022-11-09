import React, { useCallback, useContext } from "react";
import {Campaign, ProfileResponse, Poap} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { AuthContext } from "../../stores/auth";
import ModerationBadge from "../moderations/moderation/Badge";
import { FormattedMessage } from "react-intl";

interface BaseItemProps {
    poap: Poap;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (poap: Poap) => void;
};

export const BaseItem = (props: BaseItemProps) => {
    const poap = props.poap;

    const handleShowModerations = useCallback(() => {
        if(props.onShowModerations) {
            props.onShowModerations(props.poap);
        }
    }, [props.poap, props.onShowModerations]);

    return (
        <article className="media">
            <div className="media-content">
                <div className="content">
                    <div className="poap-logo">
                        <img 
                            className="mini"
                            src={"data:image/svg+xml;utf8," + encodeURIComponent(poap.logo)} 
                        />
                    </div>
                    <div>
                        <ModerationBadge
                            reason={poap.moderated}
                            onShowModerations={handleShowModerations} 
                        />
                    </div>
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign?: Campaign;
    poap: Poap;
    onEdit: (poap: Poap) => void;
    onDelete: (poap: Poap) => void;
    onReport: (poap: Poap) => void;
    onShowModerations?: (poap: Poap) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
    const {poap} = props;

    const creatorReq = useFindUserById(poap.createdBy);

    const creator = poap.createdBy;

    const canEdit = (props.campaign?.state === CampaignState.PUBLISHED && 
        auth.user && (auth.user._id === creator && creator !== 0));

    return (
        <BaseItem
            user={creatorReq.data}
            poap={poap}
            onShowModerations={props.onShowModerations}
        >
            <p>
                <small>
                    {canEdit && 
                        <>
                            <a
                                title="Edit poap"
                                onClick={() => props.onEdit(poap)}
                            >
                                <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                            </a>
                            &nbsp;·&nbsp;
                            <a
                                title="Delete poap"
                                onClick={() => props.onDelete(poap)}
                            >
                                <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> <FormattedMessage id="Delete" defaultMessage="Delete"/></span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    {auth.user && 
                        <>
                            <a
                                title="Report poap"
                                onClick={() => props.onReport(poap)}
                            >
                                <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> <FormattedMessage id="Report" defaultMessage="Report"/></span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    <TimeFromNow 
                        date={BigInt.asIntN(64, poap.createdAt)}
                    />
                    {poap.updatedBy && poap.updatedBy.length > 0 &&
                        <>
                            &nbsp;·&nbsp;<b><i><FormattedMessage id="Edited" defaultMessage="Edited"/></i></b>
                        </>
                    }
                </small>
            </p>
        </BaseItem>
    );
};