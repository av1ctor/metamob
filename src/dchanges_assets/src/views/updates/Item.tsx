import React, { useContext, useState } from "react";
import ReactMarkdown from 'react-markdown';
import {Update} from "../../../../declarations/dchanges/dchanges.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";

interface ItemProps {
    update: Update;
    canEdit: boolean;
    onEdit: (update: Update) => void;
    onDelete: (update: Update) => void;
    onReport: (update: Update) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);

    const update = props.update;

    const profile = useFindUserById(['users', update.createdBy], update.createdBy);

    return (
        <article className="media">
            <div className="media-left">
                <div className="flex-node w-12">
                    <Avatar id={update.createdBy} size='lg' noName={true} />
                </div>
            </div>
            <div className="media-content">
                <div className="content">
                    <strong>{profile?.isSuccess && profile?.data.name}</strong>
                    <br />
                    <ReactMarkdown className="update-body" children={update.body}/>
                    <p>
                        <small>
                            {props.canEdit && 
                                <>
                                    <a
                                        title="Edit update"
                                        onClick={() => props.onEdit(update)}
                                    >
                                        <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                    <a
                                        title="Delete update"
                                        onClick={() => props.onDelete(update)}
                                    >
                                        <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                </>
                            }
                            {auth.user && 
                                <>
                                    <a
                                        title="Report update"
                                        onClick={() => props.onReport(update)}
                                    >
                                        
                                        <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> Report</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                </>
                            }
                            <TimeFromNow 
                                date={BigInt.asIntN(64, update.createdAt)}
                            />
                            {update.updatedBy && update.updatedBy.length > 0 &&
                                <>
                                    &nbsp;·&nbsp;<b><i>Edited</i></b>
                                </>
                            }
                        </small>
                    </p>
                </div>
            </div>
        </article>
    );
};
