import React, { useContext } from "react";
import {Campaign, ProfileResponse, SignatureResponse} from "../../../../declarations/metamob/metamob.did";
import { Markdown } from "../../components/Markdown";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";
import ModerationBadge from "../moderations/moderation/Badge";

interface BaseItemProps {
    signature: SignatureResponse;
    user?: ProfileResponse;
    children?: any;
    onShowModerations?: (signature: SignatureResponse) => void;
};

export const BaseItem = (props: BaseItemProps) => {
    const signature = props.signature;

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
                        <ModerationBadge
                            reason={signature.moderated}
                            onShowModerations={() => props.onShowModerations && props.onShowModerations(signature)} 
                        />
                    </div>
                    <Markdown 
                        className="update-body" 
                        body={signature.body || '\n&nbsp;\n'}
                    />
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign: Campaign;
    signature: SignatureResponse;
    onEdit: (signature: SignatureResponse) => void;
    onDelete: (signature: SignatureResponse) => void;
    onReport: (signature: SignatureResponse) => void;
    onShowModerations: (signature: SignatureResponse) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
    const {signature} = props;

    const author = signature.createdBy && signature.createdBy.length > 0?
        signature.createdBy[0] || 0:
        0;

    const user = useFindUserById(author);

    const canEdit = (props.campaign.state === CampaignState.PUBLISHED && 
        auth.user && (auth.user._id === author && author !== 0));

    return (
        <BaseItem
            user={user.data}
            signature={signature}
            onShowModerations={props.onShowModerations}
        >
            <p>
                <small>
                    {canEdit && 
                        <>
                            <a
                                title="Edit signature"
                                onClick={() => props.onEdit(signature)}
                            >
                                <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                            </a>
                            &nbsp;·&nbsp;
                            <a
                                title="Delete signature"
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
                                title="Report signature"
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
        </BaseItem>
    );
};
