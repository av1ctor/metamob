import React, { useCallback, useContext, useEffect, useState } from "react";
import { ReportResponse } from "../../../../../../declarations/metamob/metamob.did";
import Modal from "../../../../components/Modal";
import TimeFromNow from "../../../../components/TimeFromNow";
import { useFindUserReports } from "../../../../hooks/reports";
import { AuthContext } from "../../../../stores/auth";
import {BaseItem} from "../../../reports/Item";
import EditForm from "../../../reports/report/Edit";
import { Paginator } from "../../../../components/Paginator";
import { ReportState } from "../../../../libs/reports";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../../hooks/ui";

interface Props {
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const MyReports = (props: Props) => {
    const [auth, ] = useContext(AuthContext);

    const {showError, toggleLoading} = useUI();

    const [limit, setLimit] = useState({
        offset: 0,
        size: 4
    });
    const [modals, setModals] = useState({
        edit: false,
    });
    const [report, setReport] = useState<ReportResponse>();

    const reports = useFindUserReports(orderBy, limit, auth.user?._id);
    
    const toggleEdit = useCallback((report: ReportResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit,
        }));
        setReport(report);
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
        toggleLoading(reports.status === "loading");
        if(reports.status === "error") {
            showError(reports.error.message);
        }
    }, [reports.status]);

    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage id="My reports" defaultMessage="My reports"/>
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
                                partial
                                
                                
                            >
                                <p>
                                    <small>
                                        {report.state !== ReportState.CLOSED &&
                                            <span>
                                                <a
                                                    title="Edit report"
                                                    onClick={() => toggleEdit(report)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-pencil" /> <FormattedMessage id="Edit" defaultMessage="Edit"/></span>
                                                </a>
                                                &nbsp;·&nbsp;
                                            </span>
                                        }
                                        <TimeFromNow 
                                            date={BigInt.asIntN(64, report.createdAt)}
                                        />
                                        {report.updatedBy && report.updatedBy.length > 0 &&
                                            <>
                                                &nbsp;·&nbsp;<b><i><FormattedMessage id="Edited" defaultMessage="Edited"/></i></b>
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
                header={<span><FormattedMessage id="Edit report" defaultMessage="Edit report"/></span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {report && 
                    <EditForm
                        report={report} 
                        onClose={toggleEdit}
                        
                        
                        
                    />
                }
            </Modal>
        </>
    );
};

export default MyReports;