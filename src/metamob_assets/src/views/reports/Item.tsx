import React, { useContext } from "react";
import {Campaign, ProfileResponse, ReportResponse} from "../../../../declarations/metamob/metamob.did";
import TimeFromNow from "../../components/TimeFromNow";
import { useFindUserById } from "../../hooks/users";
import { CampaignState } from "../../libs/campaigns";
import { reportResultToColor, reportResultToText, ReportState, reportStateToColor, reportStateToText } from "../../libs/reports";
import { isModerator } from "../../libs/users";
import { AuthContext } from "../../stores/auth";
import Avatar from "../users/Avatar";
import { Markdown } from "../../components/Markdown";
import EntityPreview from "./report/EntityPreview";
import Badge from "../../components/Badge";
import Box from "../../components/Box";

interface BaseItemProps {
    report: ReportResponse;
    partial?: boolean;
    user?: ProfileResponse;
    children?: any;
    onModerate?: (report: ReportResponse) => void;
};

export const BaseItem = (props: BaseItemProps) => {
    const report = props.report;

    return (
        <Box className="report-item">
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
                        <Markdown
                            className="update-body" 
                            body={report.description || '\n&nbsp;\n'}
                        />
                        <Badge 
                            color={reportStateToColor(report.state)}
                        >
                            {reportStateToText(report.state)}
                        </Badge>
                        
                        <Badge 
                            color={reportResultToColor(report.result)}
                            title={report.resolution}
                        >
                            {reportResultToText(report.result)}
                        </Badge>

                        <div>
                            <EntityPreview
                                report={report}
                                partial
                                
                                
                            />
                        </div>
                    </div>
                    <div className="controls">
                        {props.children}
                    </div>
                </div>
            </article>
        </Box>
    );
};

interface ItemProps {
    campaign: Campaign;
    report: ReportResponse;
    onEdit: (report: ReportResponse) => void;
    onModerate?: (report: ReportResponse) => void;
    onDelete: (report: ReportResponse) => void;
    onReport: (report: ReportResponse) => void;
};

export const Item = (props: ItemProps) => {
    const [auth, ] = useContext(AuthContext);
    
    const {report} = props;

    const author = report.createdBy;

    const user = useFindUserById(author);

    const canEdit = (props.campaign.state === CampaignState.PUBLISHED && 
        auth.user && (author.length > 0 && auth.user._id === author[0])) ||
        (auth.user && isModerator(auth.user));

    return (
        <BaseItem
            user={user.data}
            report={report}
            onModerate={props.onModerate}
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
