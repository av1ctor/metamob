import React, { useCallback } from "react";
import {Campaign, ProfileResponse, Poap} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import ModerationBadge from "../moderations/moderation/Badge";
import { FormattedMessage } from "react-intl";
import Button from "../../components/Button";
import { PoapState } from "../../libs/poap";
import { useAuth } from "../../hooks/auth";

interface BaseItemProps {
    campaign?: Campaign;
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
                    <div className="has-text-centered">
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
    onMint?: (poap: Poap) => void;
};

export const Item = (props: ItemProps) => {
    const {user} = useAuth();
    
    const {poap} = props;

    const author = useFindUserById(poap.createdBy);

    const authorId = poap.createdBy;

    const canEdit = (props.campaign?.state === CampaignState.PUBLISHED && 
        user && (user._id === authorId && authorId !== 0));

    const maxSupply = poap.maxSupply.length > 0? poap.maxSupply[0] || Number.MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER;
    const canMint = (poap.state === PoapState.MINTING) && 
        (poap.totalSupply < maxSupply) &&
        (props.campaign?.state === CampaignState.PUBLISHED);

    return (
        <BaseItem
            user={author.data}
            campaign={props.campaign}
            poap={poap}
            onShowModerations={props.onShowModerations}
        >
            {props.onMint &&
                <div className="has-text-centered">
                    <Button
                        color="dark"
                        disabled={!canMint || !user}
                        onClick={() => props.onMint? props.onMint(poap): null}
                    >
                        <i className="la la-hammer"/>&nbsp;<FormattedMessage id="Mint" defaultMessage="Mint"/>
                    </Button>
                </div>
            }

            <p className="has-text-centered">
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
                    {user && 
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
                    {poap.totalSupply}/{maxSupply !== Number.MAX_SAFE_INTEGER? maxSupply.toString(): '∞'}
                    &nbsp;·&nbsp;
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
