import React, { useState } from "react";
import {Comment} from "../../../../declarations/dchanges/dchanges.did";
import Button from "../../components/Button";
import TimeFromNow from "../../components/TimeFromNow";
import Avatar from "../users/Avatar";

interface ItemProps {
    comment: Comment;
    canReply: boolean;
    canEdit: boolean;
    onEdit: (comment: Comment) => void;
    onReply: (comment: Comment) => void;
    onDelete: (comment: Comment) => void;
};

export const Item = (props: ItemProps) => {
    const comment = props.comment;

    return (
        <div className="pb-1">
            <div className="flex border-t mt-4 pt-2">
                <div className="flex-node w-12">
                    <Avatar id={comment.createdBy} size='lg' />
                </div>
                <div className="flex-1"></div>
                <div className="flex-none w-8 text-gray-400">
                    <TimeFromNow 
                        date={BigInt.asIntN(64, comment.createdAt)}
                    />
                </div>
            </div>
            <div className="flex">
                <div className="flex-none w-12"></div>
                <div className="flex-1 pl-2 pb-12">
                    {comment.body}
                </div>
            </div>
            <div className="flex justify-end">
                <div className="flex gap-1">
                    {props.canEdit && 
                        <>
                            <div className="flex-1" title="edit">
                                <Button
                                    onClick={() => props.onEdit(comment)}
                                >
                                    <i className="la la-pencil" />
                                </Button>
                            </div>
                            <div className="flex-1" title="delete">
                                <Button
                                    onClick={() => props.onDelete(comment)}
                                >
                                    <i className="la la-trash" />
                                </Button>
                            </div>
                        </>
                    }
                    {props.canReply && 
                        <div className="flex-1" title="reply">
                            <Button
                                onClick={() => props.onReply(comment)}>
                                <span className="whitespace-nowrap"><i className="la la-reply" /> Reply</span>
                            </Button>
                        </div>
                    }
                </div>
            </div>
        </div>
    );
};
