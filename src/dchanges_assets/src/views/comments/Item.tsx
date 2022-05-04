import React, { useState } from "react";
import ReactMarkdown from 'react-markdown';
import {Comment} from "../../../../declarations/dchanges/dchanges.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import Avatar from "../users/Avatar";

interface ItemProps {
    comment: Comment;
    canReply: boolean;
    canEdit: boolean;
    onEdit: (comment: Comment) => void;
    onReply: (comment: Comment) => void;
    onDelete: (comment: Comment) => void;
    onReport: (comment: Comment) => void;
};

export const Item = (props: ItemProps) => {
    const comment = props.comment;

    const profile = comment.createdBy?
        useFindUserById(['user'], comment.createdBy):
        undefined;

    return (
        <article className="media">
            <div className="media-left">
                <div className="flex-node w-12">
                    <Avatar id={comment.createdBy} size='lg' noName={true} />
                </div>
            </div>
            <div className="media-content">
                <div className="content">
                    <p>
                        <strong>{profile?.isSuccess && profile?.data.name}</strong>
                        <br />
                        <ReactMarkdown children={comment.body}/>
                    </p>
                    <p>
                        <small>
                            {props.canEdit && 
                                <>
                                    <a
                                        title="edit"
                                        onClick={() => props.onEdit(comment)}
                                    >
                                        <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                    <a
                                        title="delete"
                                        onClick={() => props.onDelete(comment)}
                                    >
                                        <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                </>
                            }
                            {props.canReply && 
                                <>
                                    <a
                                        title="reply"
                                        onClick={() => props.onReply(comment)}
                                    >
                                        
                                        <span className="whitespace-nowrap has-text-success"><i className="la la-reply" /> Reply</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                </>
                            }
                            <a
                                title="report"
                                onClick={() => props.onReport(comment)}
                            >
                                
                                <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> Report</span>
                            </a>
                            &nbsp;·&nbsp;
                            <TimeFromNow 
                                date={BigInt.asIntN(64, comment.createdAt)}
                            />
                        </small>
                    </p>
                </div>
            </div>
        </article>
    );
};
