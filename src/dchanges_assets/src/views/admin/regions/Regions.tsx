import React, { useCallback, useState } from "react";
import Modal from "../../../components/Modal";
import { Filter, Limit, Order } from "../../../libs/common";
import { Region, Profile } from "../../../../../declarations/dchanges/dchanges.did";
import TextField from "../../../components/TextField";
import TimeFromNow from "../../../components/TimeFromNow";
import EditUserForm from "../users/Edit";
import { useFindRegions } from "../../../hooks/regions";
import EditForm from "./Edit";
import { kindToText } from "../../../libs/regions";

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

const Regions = (props: Props) => {
    const [user, setUser] = useState<Profile>();
    const [region, setRegion] = useState<Region>();
    const [modals, setModals] = useState({
        edit: false,
        editUser: false,
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

    const handleEdit = useCallback((item: Region) => {
        setRegion(item);
        toggleEdit();
    }, []);

    const handleEditUser = useCallback((user: Profile) => {
        setUser(user);
        toggleEditUser();
    }, []);

    const regions = useFindRegions(['regions', ...filters], filters, orderBy, limit);

    return (
        <>
            <div className="level">
                <div className="level-left">
                    <div className="is-size-2"><b>Regions</b></div>
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
                                Id
                            </div>
                            <div className="column">
                                Name
                            </div>
                            <div className="column is-1">
                                Kind
                            </div>
                            <div className="column is-1">
                                Age
                            </div>
                        </div>
                    </div>
                    <div className="body">
                        {regions.isSuccess && regions.data && 
                            regions.data.map((item, index) => 
                                <div 
                                    className="columns" 
                                    key={index}
                                    onClick={() => handleEdit(item)}
                                >
                                    <div className="column is-2 is-size-7">
                                        {item.pubId}
                                    </div>
                                    <div className="column">
                                        {item.name}
                                    </div>
                                    <div className="column is-1">
                                        {kindToText(item.kind)}
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
                header={<span>Edit region</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {region &&
                    <EditForm
                        region={region}
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

export default Regions;