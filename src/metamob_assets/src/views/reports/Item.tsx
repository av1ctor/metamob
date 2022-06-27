import React, { useContext } from "react";
import {Campaign, ProfileResponse, Report} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { ReportState, reportStateToText } from "../../libs/reports";
import { isModerator } from "../../libs/users";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";
import { Markdown } from "../../components/Markdown";
import Entity from "./report/Entity";
import Badge from "../../components/Badge";

interface BaseItemProps {
    report: Report;
    partial?: boolean;
    user?: ProfileResponse;
    children?: any;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

export const BaseItem = (props: BaseItemProps) => {
    const report = props.report;

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
                    <div>
                        <strong>{props.user?.name}</strong>
                    </div>
                    <Markdown
                        className="update-body" 
                        body={report.description || '\n&nbsp;\n'}
                    />
                    <Badge color="warning">
                        {reportStateToText(report.state)}
                    </Badge>
                    <div>
                        <Entity
                            report={report}
                            partial={props.partial}
                            onSuccess={props.onSuccess}
                            onError={props.onError}
                        />
                    </div>
                    {props.children}
                </div>
            </div>
        </article>
    );
};

interface ItemProps {
    campaign: Campaign;
    report: Report;
    onEdit: (report: Report) => void;
    onDelete: (report: Report) => void;
    onReport: (report: Report) => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
    const {report} = props;

    const author = report.createdBy;

    const user = useFindUserById(author);

    const canEdit = (props.campaign.state === CampaignState.PUBLISHED && 
        auth.user && (auth.user._id === author && author !== 0)) ||
        (auth.user && isModerator(auth.user));

    return (
        <BaseItem
            user={user.data}
            report={report}
            onSuccess={props.onSuccess}
            onError={props.onError}
        >
            <p>
                <small>
                    {canEdit && 
                        <>
                            <a
                                title="Edit report"
                                onClick={() => props.onEdit(report)}
                            >
                                <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
                            </a>
                            &nbsp;·&nbsp;
                            <a
                                title="Delete report"
                                onClick={() => props.onDelete(report)}
                            >
                                <span className="whitespace-nowrap has-text-danger"><i className="la la-trash" /> Delete</span>
                            </a>
                            &nbsp;·&nbsp;
                        </>
                    }
                    <TimeFromNow 
                        date={BigInt.asIntN(64, report.createdAt)}
                    />
                    {report.updatedBy && report.updatedBy.length > 0 &&
                        <>
                            &nbsp;·&nbsp;<b><i>Edited</i></b>
                        </>
                    }
                </small>
            </p>
        </BaseItem>
    );
};
