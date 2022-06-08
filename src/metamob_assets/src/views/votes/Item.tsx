import React, { useContext } from "react";
import ReactMarkdown from "react-markdown";
import {Campaign, ProfileResponse, VoteResponse} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { isModerator } from "../../libs/users";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";
import { Badge } from "./vote/Badge";

interface BaseItemProps {
    vote: VoteResponse;
    user?: ProfileResponse;
    children?: any;
};

export const BaseItem = (props: BaseItemProps) => {
    const vote = props.vote;

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
                    Voted: <Badge pro={props.vote.pro} />
                    <br />
                    <ReactMarkdown className="update-body" children={vote.body}/>
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign: Campaign;
    vote: VoteResponse;
    onEdit: (vote: VoteResponse) => void;
    onDelete: (vote: VoteResponse) => void;
    onReport: (vote: VoteResponse) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
    const {vote} = props;

    const author = vote.createdBy && vote.createdBy.length > 0?
        vote.createdBy[0] || 0:
        0;

    const user = useFindUserById(author);

    const canEdit = (props.campaign.state === CampaignState.PUBLISHED && 
        auth.user && (auth.user._id === author && author !== 0)) ||
        (auth.user && isModerator(auth.user));

    return (
        <BaseItem
            user={user.data}
            vote={vote}
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
                    {auth.user && 
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
