import React, { useContext, useState } from "react";
import ReactMarkdown from 'react-markdown';
import {Signature} from "../../../../declarations/dchanges/dchanges.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";

interface ItemProps {
    signature: Signature;
    canEdit: boolean;
    onEdit: (signature: Signature) => void;
    onDelete: (signature: Signature) => void;
    onReport: (signature: Signature) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
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
                            {auth.user && 
                                <>
                                    <a
                                        title="report"
                                        onClick={() => props.onReport(signature)}
                                    >
                                        <span className="whitespace-nowrap has-text-warning"><i className="la la-flag" /> Report</span>
                                    </a>
                                    &nbsp;·&nbsp;
                                </>
                            }
                            <TimeFromNow 
                                date={BigInt.asIntN(64, signature.createdAt)}
                            />
                            {signature.updatedBy && signature.updatedBy.length > 0 &&
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
