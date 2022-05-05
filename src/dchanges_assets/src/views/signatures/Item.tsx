import React, { useState } from "react";
import ReactMarkdown from 'react-markdown';
import {Signature} from "../../../../declarations/dchanges/dchanges.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import Avatar from "../users/Avatar";

interface ItemProps {
    signature: Signature;
    canReply: boolean;
    canEdit: boolean;
    onEdit: (signature: Signature) => void;
    onReply: (signature: Signature) => void;
    onDelete: (signature: Signature) => void;
    onReport: (signature: Signature) => void;
};

export const Item = (props: ItemProps) => {
    const signature = props.signature;

    const profile = signature.createdBy?
        useFindUserById(['user'], signature.createdBy):
        undefined;

    return (
        <article className="media">
            <div className="media-left">
                <div className="flex-node w-12">
                    <Avatar id={signature.createdBy} size='lg' noName={true} />
                </div>
            </div>
            <div className="media-content">
                <div className="content">
                    <strong>{profile?.isSuccess && profile?.data.name}</strong>
                    <br />
                    <ReactMarkdown children={signature.body}/>
                    <p>
                        <small>
                            {props.canEdit && 
                                <>
                                    <a
                                        title="edit"
                                        onClick={() => props.onEdit(signature)}
                                    >
                                        <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                    <a
                                        title="delete"
                                        onClick={() => props.onDelete(signature)}
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
                                        onClick={() => props.onReply(signature)}
                                    >
                                        
                                        <span className="whitespace-nowrap has-text-success"><i className="la la-reply" /> Reply</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                </>
                            }
                            <a
                                title="report"
                                onClick={() => props.onReport(signature)}
                            >
                                
                                <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> Report</span>
                            </a>
                            &nbsp;·&nbsp;
                            <TimeFromNow 
                                date={BigInt.asIntN(64, signature.createdAt)}
                            />
                        </small>
                    </p>
                </div>
            </div>
        </article>
    );
};
