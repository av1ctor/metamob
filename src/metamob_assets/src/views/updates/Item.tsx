import React, { useCallback, useContext } from "react";
import {ProfileResponse, Update} from "../../../../declarations/metamob/metamob.did";
import { Markdown } from "../../components/Markdown";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";
import ModerationBadge from "../moderations/moderation/Badge";

interface BaseItemProps {
    update: Update;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (update: Update) => void;
};

export const BaseItem = (props: BaseItemProps) => {
    const update = props.update;

    const handleShowModerations = useCallback(() => {
        if(props.onShowModerations) {
            props.onShowModerations(props.update);
        }
    }, [props.update, props.onShowModerations]);

    return (
        <article className="media">
            {props.user &&
                <div className="media-left">
                    <div className="flex-node w-12">
                        <Avatar id={update.createdBy} size='lg' noName={true} />
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
                    <br />
                    <div>
                        <ModerationBadge
                            reason={update.moderated}
                            onShowModerations={handleShowModerations} 
                        />
                    </div>
                    <Markdown 
                        className="update-body" 
                        body={update.body}
                    />
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    update: Update;
    canEdit: boolean;
    onEdit: (update: Update) => void;
    onDelete: (update: Update) => void;
    onReport: (update: Update) => void;
    onShowModerations?: (update: Update) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);

    const update = props.update;

    const creatorReq = useFindUserById(update.createdBy);

    return (
        <BaseItem
            user={creatorReq.data}
            update={update}
            onShowModerations={props.onShowModerations}
        >
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
        </BaseItem>
    );
};
