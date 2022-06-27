import React, { useCallback, useContext, useEffect, useState } from "react";
import { Profile, Report } from "../../../../../declarations/metamob/metamob.did";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindReportsAssigned } from "../../../hooks/reports";
import { ActorContext } from "../../../stores/actor";
import { AuthContext } from "../../../stores/auth";
import {BaseItem} from "../../reports/Item";
import EditForm from "./Edit";
import ModerateForm from "../../reports/report/Moderate";
import { Paginator } from "../../../components/Paginator";
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

const Moderations = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState, ] = useContext(AuthContext);

    const [limit, setLimit] = useState({
        offset: 0,
        size: 6
    });
    const [modals, setModals] = useState({
        edit: false,
        editUser: false,
    });
    const [report, setReport] = useState<Report>();
    const [user, setUser] = useState<Profile>();

    const reports = useFindReportsAssigned(
        authState.user?._id || 0, 
        orderBy, 
        limit, 
        actorState.main
    );
    
    const toggleModerate = useCallback((report: Report | undefined = undefined) => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
        setReport(report);
    }, []);

    const toggleEditUser = useCallback(() => {
        setModals(modals => ({
            ...modals,
            editUser: !modals.editUser
        }));
    }, []);

    const handleEditUser = useCallback((item: Profile) => {
        setUser(item);
        toggleEditUser();
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
                My moderations
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
                                onSuccess={props.onSuccess}
                                onError={props.onError}
                            >
                                <p>
                                    <small>
                                        {report.state !== ReportState.CLOSED &&
                                            <span>
                                                <a
                                                    title="Moderate report"
                                                    onClick={() => toggleModerate(report)}
                                                >
                                                    <span className="whitespace-nowrap"><i className="la la-pencil" /> Moderate</span>
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
                header={<span>Moderate report</span>}
                isOpen={modals.edit}
                onClose={toggleModerate}
            >
                {report && 
                    <ModerateForm
                        report={report} 
                        onEditUser={handleEditUser}
                        onClose={toggleModerate}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>

            <Modal
                header={<span>Edit user</span>}
                isOpen={modals.editUser}
                onClose={toggleEditUser}
            >
                {user &&
                    <EditForm
                        user={user}
                        onClose={toggleEditUser}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                }
            </Modal>
        </>
    );
};

export default Moderations;