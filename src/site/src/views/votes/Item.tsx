import React, { useCallback } from "react";
import {Campaign, ProfileResponse, VoteResponse} from "../../../../declarations/metamob/metamob.did";
import { Markdown } from "../../components/Markdown";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import Avatar from "../users/Avatar";
import { Badge } from "./vote/Badge";
import ModerationBadge from "../moderations/moderation/Badge";
import { useAuth } from "../../hooks/auth";

interface BaseItemProps {
    vote: VoteResponse;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (vote: VoteResponse) => void;
};

export const BaseItem = (props: BaseItemProps) => {
    const vote = props.vote;

    const handleShowModerations = useCallback(() => {
        if(props.onShowModerations) {
            props.onShowModerations(props.vote);
        }
    }, [props.vote, props.onShowModerations]);

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
                        Voted: <Badge pro={props.vote.pro} />
                    </div>
                    <div>
                        <ModerationBadge
                            reason={vote.moderated}
                            onShowModerations={handleShowModerations} 
                        />
                    </div>
                    <Markdown 
                        className="update-body" 
                        body={vote.body || '\n&nbsp;\n'}
                    />
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign?: Campaign;
    vote: VoteResponse;
    onEdit: (vote: VoteResponse) => void;
    onDelete: (vote: VoteResponse) => void;
    onReport: (vote: VoteResponse) => void;
    onShowModerations?: (vote: VoteResponse) => void;
};

export const Item = (props: ItemProps) => {
    const {user} = useAuth();
    
    const {vote} = props;

    const author = useFindUserById(vote.createdBy);

    const authorId = vote.createdBy && vote.createdBy.length > 0?
        vote.createdBy[0] || 0:
        0;

    const canEdit = (props.campaign?.state === CampaignState.PUBLISHED && 
        user && (user._id === authorId && authorId !== 0));

    return (
        <BaseItem
            user={author.data}
            vote={vote}
            onShowModerations={props.onShowModerations}
        >
            <p>
                <small>
                    {canEdit && 
                        <>
                            <a
                                title="Edit vote"
                                onClick={() => props.onEdit(vote)}
                            >
                                <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                            </a>
                            &nbsp;·&nbsp;
                            <a
                                title="Delete vote"
                                onClick={() => props.onDelete(vote)}
                            >
                                <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    {user && 
                        <>
                            <a
                                title="Report vote"
                                onClick={() => props.onReport(vote)}
                            >
                                <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> Report</span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    <TimeFromNow 
                        date={BigInt.asIntN(64, vote.createdAt)}
                    />
                    {vote.updatedBy && vote.updatedBy.length > 0 &&
                        <>
                            &nbsp;·&nbsp;<b><i>Edited</i></b>
                        </>
                    }
                </small>
            </p>
        </BaseItem>
    );
};
