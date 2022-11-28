import React, { useCallback, useState } from "react";
import { Profile, ReportResponse } from "../../../../../declarations/metamob/metamob.did";
import Modal from "../../../components/Modal";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindReports } from "../../../hooks/reports";
import { Filter, Order } from "../../../libs/common";
import { ReportState, reportStateToText } from "../../../libs/reports";
import { entityTypeToColor, entityTypeToText } from "../../../libs/common";
import ModerateForm from "../../reports/report/Moderate";
import EditUserForm from "../../../views/users/user/Edit";
import Badge from "../../../components/Badge";
import SelectField, {Option} from "../../../components/SelectField";
import { Paginator } from "../../../components/Paginator";
import EntityModerate from "../../reports/report/EntityModerate";

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

const states: Option[] = [
    {name: 'Created', value: ReportState.CREATED},
    {name: 'Assigned', value: ReportState.ASSIGNED},
    {name: 'Closed', value: ReportState.CLOSED},
];

interface Props {
}

const Reports = (props: Props) => {
    const [user, setUser] = useState<Profile>();
    const [report, setReport] = useState<ReportResponse>();
    const [limit, setLimit] = useState({
        offset: 0,
        size: 10
    });
    const [modals, setModals] = useState({
        edit: false,
        editUser: false,
        moderate: false,
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
    
    const toggleEdit = useCallback(() => {
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
    }, []);

    const toggleModerate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            moderate: !modals.moderate
        }));
    }, []);

    const toggleEditUser = useCallback(() => {
        setModals(modals => ({
            ...modals,
            editUser: !modals.editUser
        }));
    }, []);

    const handleReport = useCallback((item: ReportResponse) => {
        setReport(item);
        switch(item.state) {
            case ReportState.ASSIGNED:
                toggleEdit();
                break;
        }
    }, []);

    const handleModerate = useCallback((item: ReportResponse) => {
        setReport(item);
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

    const reports = useFindReports(filters, orderBy, limit);

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
                    />
                }
            </Modal>            

            <Modal
                header={<span>Moderate entity</span>}
                isOpen={modals.moderate}
                onClose={toggleModerate}
            >
                {report && 
                    <EntityModerate
                        report={report}
                        onClose={toggleModerate}
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
                    />
                }
            </Modal>
        </>
    );
};

export default Reports;