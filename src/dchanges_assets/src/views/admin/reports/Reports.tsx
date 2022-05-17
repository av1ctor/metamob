import React, { useCallback, useContext, useState } from "react";
import { Profile, Report } from "../../../../../declarations/dchanges/dchanges.did";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindReports } from "../../../hooks/reports";
import { Filter, Limit, Order } from "../../../libs/common";
import { entityTypeToColor, entityTypeToText, ReportState, reportStateToText } from "../../../libs/reports";
import { ActorContext } from "../../../stores/actor";
import AssignForm from "./Assign";
import EditForm from "./Edit";
import EditUserForm from "../users/Edit";
import Badge from "../../../components/Badge";
import SelectField, {Option} from "../../../components/SelectField";

const orderBy: Order = {
    key: '_id',
    dir: 'desc'
};

const limit: Limit = {
    offset: 0,
    size: 10
};

const states: Option[] = [
    {name: 'Created', value: ReportState.CREATED},
    {name: 'Assigned', value: ReportState.ASSIGNED},
    {name: 'Closed', value: ReportState.CLOSED},
];

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const Reports = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [user, setUser] = useState<Profile>();
    const [report, setReport] = useState<Report>();
    const [modals, setModals] = useState({
        assign: false,
        edit: false,
        editUser: false,
    });
    const [filters, setFilters] = useState<Filter[]>([
        {
            key: 'state',
            op: 'eq',
            value: null
        }
    ]);

    const handleChangeState = useCallback((e: any) => {
        const value = e.target.value === ''? 
            null:
            Number(e.target.value);
        setFilters(filters => 
            filters.map(f => f.key !== 'state'? f: {...f, value: value})
        );
    }, []);
    
    const toggleAssign = useCallback(() => {
        setModals(modals => ({
            ...modals,
            assign: !modals.assign
        }));
    }, []);

    const toggleEdit = useCallback(() => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
    }, []);

    const toggleEditUser = useCallback(() => {
        setModals(modals => ({
            ...modals,
            editUser: !modals.editUser
        }));
    }, []);

    const reports = useFindReports(['reports', filters[0].key, filters[0].op, filters[0].value], filters, orderBy, limit, actorState.main);

    const handleReport = useCallback((report: Report) => {
        setReport(report);
        switch(report.state) {
            case ReportState.CREATED:
                toggleAssign();
                break;
            case ReportState.ASSIGNED:
                toggleEdit();
                break;
        }
    }, []);

    const handleEditUser = useCallback((user: Profile) => {
        setUser(user);
        toggleEditUser();
    }, []);

    return (
        <>
            <div className="level">
                <div className="level-left">
                    
                </div>
                <div className="level-right">
                    <SelectField
                        name="state"
                        value={filters[0].value !== ''? filters[0].value: ''}
                        options={states}
                        onChange={handleChangeState}
                    />
                </div>
            </div>
            <div>
                <div className="tabled">
                    <div className="header">
                        <div className="columns">
                            <div className="column">
                                Description
                            </div>
                            <div className="column is-2">
                                Type
                            </div>
                            <div className="column is-2">
                                State
                            </div>
                            <div className="column is-1">
                                Age
                            </div>
                        </div>
                    </div>
                    <div className="body">
                        {reports.isSuccess && reports.data && 
                            reports.data.map((item, index) => 
                                <div 
                                    className="columns" 
                                    key={index}
                                    onClick={() => handleReport(item)}
                                >
                                    <div className="column">
                                        {item.description}
                                    </div>
                                    <div className="column is-2">
                                        <Badge 
                                            color={entityTypeToColor(item.entityType)}
                                        >
                                            {entityTypeToText(item.entityType)}
                                        </Badge>
                                    </div>
                                    <div className="column is-2">
                                        {reportStateToText(item.state)}
                                    </div>
                                    <div className="column is-1">
                                        <TimeFromNow date={item.createdAt}/>
                                    </div>
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
                        onEditUser={handleEditUser}
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                    />
                }
            </Modal>            

            <Modal
                header={<span>Edit user</span>}
                isOpen={modals.editUser}
                onClose={toggleEditUser}
            >
                {user &&
                    <EditUserForm
                        user={user}
                        onClose={toggleEditUser}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                    />
                }
            </Modal>
        </>
    );
};

export default Reports;