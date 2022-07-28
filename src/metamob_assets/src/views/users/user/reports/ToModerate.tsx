import React, { useCallback, useContext, useEffect, useState } from "react";
import { ReportResponse } from "../../../../../../declarations/metamob/metamob.did";
import Modal from "../../../../components/Modal";
import TimeFromNow from "../../../../components/TimeFromNow";
import { useFindReportsAssigned } from "../../../../hooks/reports";
import { ActorContext } from "../../../../stores/actor";
import { AuthContext } from "../../../../stores/auth";
import {BaseItem} from "../../../reports/Item";
import ModerateForm from "../../../reports/report/Moderate";
import { Paginator } from "../../../../components/Paginator";
import { ReportState } from "../../../../libs/reports";
import EntityModerate from "../../../reports/report/EntityModerate";
import { entityTypeToText } from "../../../../libs/common";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const ToModerate = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const [limit, setLimit] = useState({
        offset: 0,
        size: 4
    });
    const [modals, setModals] = useState({
        edit: false,
        moderate: false,
    });
    const [report, setReport] = useState<ReportResponse>();

    const reports = useFindReportsAssigned(
        authState.user?._id || 0, 
        orderBy, 
        limit, 
        actorState.main
    );
    
    const toggleEdit = useCallback((report: ReportResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setReport(report);
    }, []);

    const toggleModerate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            moderate: !modals.moderate
        }));
    }, []);

    const handleModerate = useCallback((report: ReportResponse) => {
        setReport(report);
        toggleModerate();
    }, []);

    const handlePrevPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: Math.max(0, limit.offset - limit.size)|0
        }));
    }, []);

    const handleNextPage = useCallback(() => {
        setLimit(limit => ({
            ...limit,
            offset: limit.offset + limit.size
        }));
    }, []);

    useEffect(() => {
        props.toggleLoading(reports.status === "loading");
        if(reports.status === "error") {
            props.onError(reports.error.message);
        }
    }, [reports.status]);

    return (
        <>
            <div className="page-title has-text-info-dark">
                To moderate
            </div>

            <div>
                <div className="reports columns is-multiline">
                    {reports.status === 'success' && 
                        reports.data && 
                            reports.data.map((report) => 
                        <div
                            key={report._id}
                            className="column is-6"
                        >
                            <BaseItem 
                                report={report} 
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                            >
                                <p>
                                    <small>
                                        {report.state !== ReportState.CLOSED &&
                                            <span>
                                                <a
                                                    title="Edit report"
                                                    onClick={() => toggleEdit(report)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-pen" /> Edit</span>
                                                </a>
                                                &nbsp;·&nbsp;
                                            </span>
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
                        </div>
                    )}
                </div>

                <Paginator
                    limit={limit}
                    length={reports.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
            </div>

            <Modal
                header={<span>Edit report</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {report && 
                    <ModerateForm
                        report={report} 
                        onModerate={handleModerate}
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>

            <Modal
                header={<span>Moderate {report? entityTypeToText(report?.entityType): ''}</span>}
                isOpen={modals.moderate}
                onClose={toggleModerate}
            >
                {report && 
                    <EntityModerate
                        report={report}
                        onClose={toggleModerate}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>
        </>
    );
};

export default ToModerate;