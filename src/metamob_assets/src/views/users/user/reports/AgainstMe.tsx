import React, { useCallback, useContext, useEffect, useState } from "react";
import { ReportResponse } from "../../../../../../declarations/metamob/metamob.did";
import Modal from "../../../../components/Modal";
import TimeFromNow from "../../../../components/TimeFromNow";
import { useFindAgainstUserReports } from "../../../../hooks/reports";
import { ActorContext } from "../../../../stores/actor";
import { AuthContext } from "../../../../stores/auth";
import {BaseItem} from "../../../reports/Item";
import { Paginator } from "../../../../components/Paginator";
import { ReportResult, ReportState } from "../../../../libs/reports";
import CreateForm from "../../../challenges/challenge/Create";
import { FormattedMessage } from "react-intl";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const AgainstMe = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);

    const [limit, setLimit] = useState({
        offset: 0,
        size: 4
    });
    const [modals, setModals] = useState({
        challenge: false,
    });
    const [report, setReport] = useState<ReportResponse>();

    const reports = useFindAgainstUserReports(orderBy, limit, auth.user?._id, actors.main);
    
    const toggleChallenge = useCallback((report: ReportResponse | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            challenge: !modals.challenge,
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
        props.toggleLoading(reports.status === "loading");
        if(reports.status === "error") {
            props.onError(reports.error.message);
        }
    }, [reports.status]);

    return (
        <>
            <div className="page-title has-text-info-dark">
                <FormattedMessage id="Against me" defaultMessage="Against me"/>
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
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                            >
                                <p>
                                    <small>
                                        {report.state === ReportState.CLOSED && report.result == ReportResult.MODERATED &&
                                            <span>
                                                <a
                                                    title="Challenge report"
                                                    onClick={() => toggleChallenge(report)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-bullhorn" /> <FormattedMessage id="Challenge" defaultMessage="Challenge"/></span>
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
                header={<span><FormattedMessage id="Challenge moderation" defaultMessage="Challenge moderation"/></span>}
                isOpen={modals.challenge}
                onClose={toggleChallenge}
            >
                {report && report.moderationId.length > 0 &&
                    <CreateForm
                        moderationId={report.moderationId[0] || 0} 
                        onClose={toggleChallenge}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>
        </>
    );
};

export default AgainstMe;