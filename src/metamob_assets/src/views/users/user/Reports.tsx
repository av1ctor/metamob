import React, { useCallback, useContext, useEffect, useState } from "react";
import { Report } from "../../../../../declarations/metamob/metamob.did";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindUserReports } from "../../../hooks/reports";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";
import {BaseItem} from "../../reports/Item";
import EditForm from "../../reports/report/Edit";
import { Paginator } from "../../../components/Paginator";
import { isModerator } from "../../../libs/users";
import Moderations from "./Moderations";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import BecomeModForm from "./BecomeMod";
import { ReportState } from "../../../libs/reports";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const orderBy = [{
    key: '_id',
    dir: 'desc'
}];

const Reports = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const [limit, setLimit] = useState({
        offset: 0,
        size: 6
    });
    const [modals, setModals] = useState({
        edit: false,
        becomeMod: false,
    });
    const [report, setReport] = useState<Report>();

    const reports = useFindUserReports(orderBy, limit, actorState.main);
    
    const toggleEdit = useCallback((report: Report | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit,
        }));
        setReport(report);
    }, []);

    const toggleBecomeMod = useCallback(() => {
        setModals(modals => ({
            ...modals,
            becomeMod: !modals.becomeMod,
        }));
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

    if(!authState.user) {
        return <div>Forbidden</div>;
    }

    return (
        <>
            <div className="page-title has-text-info-dark">
                My reports
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
                                user={authState.user}
                                report={report} 
                                partial
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
                                                    <span className="whitespace-nowrap"><i className="la la-pencil" /> Edit</span>
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

            <div className="mt-6">
                {isModerator(authState.user)?
                    <>
                        <div className="divider dark"></div>
                        <Moderations
                            onSuccess={props.onSuccess}
                            onError={props.onError}
                            toggleLoading={props.toggleLoading}
                        />
                    </>
                :
                    <div className="container border p-4">
                        <div className="has-text-centered">
                            <b>Become a moderator and receive MMT's on every moderation done!</b>
                        </div>
                        <div className="field is-grouped mt-2">
                            <div className="control">
                                <Button 
                                    onClick={toggleBecomeMod}
                                >
                                    Sign up!
                                </Button>
                            </div>
                        </div>
                    </div>
                }
            </div>

            <Modal
                header={<span>Edit report</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {report && 
                    <EditForm
                        report={report} 
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>

            <Modal
                header={<span>Become a moderator</span>}
                isOpen={modals.becomeMod}
                onClose={toggleBecomeMod}
            >
                <BecomeModForm
                    onClose={toggleBecomeMod}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>
        </>
    );
};

export default Reports;