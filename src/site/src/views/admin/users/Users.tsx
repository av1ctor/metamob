import React, { useCallback, useState } from "react";
import Modal from "../../../components/Modal";
import { Filter, Order } from "../../../libs/common";
import { Profile } from "../../../../../declarations/metamob/metamob.did";
import { useFindUsers } from "../../../hooks/users";
import EditForm from "./Edit";
import TextField from "../../../components/TextField";
import TimeFromNow from "../../../components/TimeFromNow";
import Badge from "../../../components/Badge";
import { Paginator } from "../../../components/Paginator";
import { Banned, findAll } from "../../../libs/users";
import Button from "../../../components/Button";
import { JsonStringfy } from "../../../libs/utils";
import saveAs from "file-saver";

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

interface Props {
}

const Users = (props: Props) => {
    const [user, setUser] = useState<Profile>();
    const [limit, setLimit] = useState({
        offset: 0,
        size: 10
    });
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

    const handleEditProfile = useCallback((item: Profile) => {
        setUser(item);
        toggleEdit();
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

    const handleExport = useCallback(async () => {
        const items = await findAll();
        const blob = new Blob([JsonStringfy(items)], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "users.json");
    }, []);

    const users = useFindUsers(filters, orderBy, limit);

    return (
        <>
            <div className="level">
                <div className="level-left">
                    <div className="is-size-2"><b><i className="la la-users"/> Users</b></div>
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
                            <div className="column is-2">
                                PubId
                            </div>
                            <div className="column">
                                Name
                            </div>
                            <div className="column is-1">
                                Active
                            </div>
                            <div className="column is-1">
                                Banned
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
                                    <div className="column is-2 is-size-7">
                                        {item.pubId}
                                    </div>
                                    <div className="column">
                                        {item.name}
                                    </div>
                                    <div className="column is-1">
                                        <Badge 
                                            color={item.active? 'success': 'warning'}
                                        >
                                            {item.active? 'true': 'false'}
                                        </Badge>
                                    </div>
                                    <div className="column is-1">
                                        {item.banned === Banned.AsUser? 
                                            <Badge color="danger">true</Badge>
                                        :
                                            <span></span>
                                        }
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
                    length={users.data?.length}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                />
            </div>

            <div className="level mt-5">
                <div className="level-left">
                </div>
                <div className="level-right">
                    <div className="buttons">
                        <Button
                            color="info"
                            onClick={handleExport}
                        >
                            <i className="la la-arrow-circle-down" />&nbsp;Export
                        </Button>
                    </div>
                </div>
            </div>

            <Modal
                header={<span>Edit user</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {user &&
                    <EditForm
                        user={user}
                        onClose={toggleEdit}
                        
                        
                        
                    />
                }
            </Modal>            
        </>
    );
};

export default Users;