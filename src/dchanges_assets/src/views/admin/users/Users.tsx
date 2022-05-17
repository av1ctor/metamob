import React, { useCallback, useContext, useState } from "react";
import Modal from "../../../components/Modal";
import { Filter, Limit, Order } from "../../..//libs/common";
import { ActorContext } from "../../../stores/actor";
import { Profile } from "../../../../../declarations/dchanges/dchanges.did";
import { useFindUsers } from "../../../hooks/users";
import EditForm from "./Edit";
import TextField from "../../../components/TextField";
import TimeFromNow from "../../../components/TimeFromNow";
import Badge from "../../../components/Badge";

const orderBy: Order = {
    key: '_id',
    dir: 'desc'
};

const limit: Limit = {
    offset: 0,
    size: 10
};

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const Users = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [user, setUser] = useState<Profile>();
    const [modals, setModals] = useState({
        edit: false,
    });
    const [filters, setFilters] = useState<Filter[]>([
        {
            key: 'pubId',
            op: 'eq',
            value: ''
        },
        {
            key: 'name',
            op: 'contains',
            value: ''
        }
    ]);

    const handleChangePubIdFilter = useCallback((e: any) => {
        const value = e.target.value;
        setFilters(filters => 
            filters.map(f => f.key !== 'pubId'? f: {...f, value: value})
        );
    }, []);

    const handleChangeNameFilter = useCallback((e: any) => {
        const value = e.target.value;
        setFilters(filters => 
            filters.map(f => f.key !== 'name'? f: {...f, value: value})
        );
    }, []);
    
    const toggleEdit = useCallback(() => {
        setModals({
            ...modals,
            edit: !modals.edit
        });
    }, [modals]);

    const handleEditProfile = useCallback((report: Profile) => {
        setUser(report);
        toggleEdit();
    }, []);

    const users = useFindUsers(['users', ...filters], filters, orderBy, limit, actorState.main);

    return (
        <>
            <div className="level">
                <div className="level-left">
                    <div className="is-size-2"><b>Users</b></div>
                </div>
                <div className="level-right">
                    <div>
                        <b>PubId</b>
                        <TextField
                            name="pubId"
                            value={filters[0].value}
                            onChange={handleChangePubIdFilter}
                        />
                    </div>
                    <div className="ml-2">
                        <b>Name</b>
                        <TextField
                            name="name"
                            value={filters[1].value}
                            onChange={handleChangeNameFilter}
                        />
                    </div>
                </div>
            </div>            
            <div>
                <div className="tabled">
                    <div className="header">
                        <div className="columns">
                            <div className="column is-3">
                                Id
                            </div>
                            <div className="column">
                                Name
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
                        {users.isSuccess && users.data && 
                            users.data.map((item, index) => 
                                <div 
                                    className="columns" 
                                    key={index}
                                    onClick={() => handleEditProfile(item)}
                                >
                                    <div className="column is-3">
                                        {item.pubId}
                                    </div>
                                    <div className="column">
                                        {item.name}
                                    </div>
                                    <div className="column is-2">
                                        {item.banned && 
                                            <Badge color="danger">Banned</Badge>
                                        }
                                        <Badge 
                                            color={item.active? 'success': 'warning'}
                                        >
                                            {item.active? 'Active': 'Inactive'}
                                        </Badge>
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
            <br />


            <Modal
                header={<span>Edit user</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {user &&
                    <EditForm
                        user={user}
                        onClose={toggleEdit}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                    />
                }
            </Modal>            
        </>
    );
};

export default Users;