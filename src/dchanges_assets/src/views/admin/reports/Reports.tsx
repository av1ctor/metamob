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
    toggleLoading: (to: boolean) => void;
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

    const handleChangeStateFilter = useCallback((e: any) => {
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

    const handleReport = useCallback((item: Report) => {
        setReport(item);
        switch(item.state) {
            case ReportState.CREATED:
                toggleAssign();
                break;
            case ReportState.ASSIGNED:
                toggleEdit();
                break;
        }
    }, []);

    const handleEditUser = useCallback((item: Profile) => {
        setUser(item);
        toggleEditUser();
    }, []);

    const reports = useFindReports(filters, orderBy, limit, actorState.main);

    return (
        <>
            <div className="level">
                <div className="level-left">
                    <div className="is-size-2"><i className="la la-flag"/> <b>Reports</b></div>
                </div>
                <div className="level-right">
                    <div>
                        <b>State</b>
                        <SelectField
                            name="state"
                            value={filters[0].value !== null? filters[0].value: ''}
                            options={states}
                            onChange={handleChangeStateFilter}
                        />
                    </div>
                </div>
            </div>
            <div>
                <div className="tabled">
                    <div className="header">
                        <div className="columns">
                            <div className="column is-2">
                                PubId
                            </div>
                            <div className="column">
                                Description
                            </div>
                            <div className="column is-1">
                                Type
                            </div>
                            <div className="column is-1">
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
                                    <div className="column is-2 is-size-7">
                                        {item.pubId}
                                    </div>
                                    <div className="column">
                                        {item.description}
                                    </div>
                                    <div className="column is-1">
                                        <Badge 
                                            color={entityTypeToColor(item.entityType)}
                                        >
                                            {entityTypeToText(item.entityType)}
                                        </Badge>
                                    </div>
                                    <div className="column is-1">
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
                        toggleLoading={props.toggleLoading}
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
                    <EditUserForm
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

export default Reports;