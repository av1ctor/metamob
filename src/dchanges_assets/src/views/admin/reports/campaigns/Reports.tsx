import React, { useCallback, useContext, useState } from "react";
import { Report } from "../../../../../../declarations/dchanges/dchanges.did";
import Modal from "../../../../components/Modal";
import TimeFromNow from "../../../../components/TimeFromNow";
import { useFindReports } from "../../../../hooks/reports";
import { Filter, Limit, Order } from "../../../../libs/common";
import { ReportState, ReportType } from "../../../../libs/reports";
import { ActorContext } from "../../../../stores/actor";
import { AuthContext } from "../../../../stores/auth";
import AssignForm from "./Assign";
import EditForm from "./Edit";

const orderBy: Order = {
    key: '_id',
    dir: 'desc'
};

const limit: Limit = {
    offset: 0,
    size: 10
};

const createdFilters: Filter[] = [
    {
        key: 'entityType',
        op: 'eq',
        value: ReportType.CAMPAIGNS
    },
    {
        key: 'state',
        op: 'eq',
        value: ReportState.CREATED
    }
];

const assignedFilters: Filter[] = [
    {
        key: 'entityType',
        op: 'eq',
        value: ReportType.CAMPAIGNS
    },
    {
        key: 'state',
        op: 'eq',
        value: ReportState.ASSIGNED
    }
];

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const Reports = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    const [authState ,] = useContext(AuthContext);
    
    const [report, setReport] = useState<Report>();
    const [modals, setModals] = useState({
        assign: false,
        edit: false,
    });
    
    const toggleAssign = useCallback(() => {
        setModals({
            ...modals,
            assign: !modals.assign
        });
    }, [modals]);

    const toggleEdit = useCallback(() => {
        setModals({
            ...modals,
            edit: !modals.edit
        });
    }, [modals]);

    const createdReports = useFindReports(['reports', ReportState.CREATED], createdFilters, orderBy, limit, actorState.main);
    const assignedReports = useFindReports(['reports', ReportState.ASSIGNED], assignedFilters, orderBy, limit, actorState.main);

    const handleAssignReport = useCallback((report: Report) => {
        setReport(report);
        toggleAssign();
    }, []);

    const handleEditReport = useCallback((report: Report) => {
        setReport(report);
        toggleEdit();
    }, []);

    return (
        <>
            <div>
                <div className="has-text-centered is-size-4"><b>Created</b></div>
                <div className="tabled">
                    <div className="header">
                        <div className="columns">
                            <div className="column">
                                Description
                            </div>
                            <div className="column is-1">
                                Age
                            </div>
                        </div>
                    </div>
                    <div className="body">
                        {createdReports.isSuccess && createdReports.data && 
                            createdReports.data.map((item, index) => 
                                <div 
                                    className="columns" 
                                    key={index}
                                    onClick={() => handleAssignReport(item)}
                                >
                                    <div className="column">{item.description}</div>
                                    <div className="column is-1"><TimeFromNow date={item.createdAt}/></div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
            <br />
            <div>
                <div className="has-text-centered is-size-4"><b>Assigned</b></div>
                <div className="tabled">
                    <div className="header">
                        <div className="columns">
                            <div className="column">
                                Description
                            </div>
                            <div className="column is-1">
                                Age
                            </div>
                        </div>
                    </div>
                    <div className="body">
                        {assignedReports.isSuccess && assignedReports.data && 
                            assignedReports.data.map((item, index) => 
                                <div 
                                    className="columns" 
                                    key={index}
                                    onClick={() => handleEditReport(item)}
                                >
                                    <div className="column ">{item.description}</div>
                                    <div className="column is-1"><TimeFromNow date={item.createdAt}/></div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>

            <Modal
                header={<span>Assign report</span>}
                isOpen={modals.assign}
                onClose={toggleAssign}
            >
                {report &&
                    <AssignForm
                        report={report}
                        onClose={toggleAssign}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                    />
                }
            </Modal>

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
                    />
                }
            </Modal>            
        </>
    );
};

export default Reports;