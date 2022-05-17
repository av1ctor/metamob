import React, { useCallback, useState } from "react";
import Modal from "../../../components/Modal";
import { Filter, Limit, Order } from "../../..//libs/common";
import { Category, Profile } from "../../../../../declarations/dchanges/dchanges.did";
import TextField from "../../../components/TextField";
import TimeFromNow from "../../../components/TimeFromNow";
import EditUserForm from "../users/Edit";
import { useFindCategories } from "../../../hooks/categories";
import Button from "../../../components/Button";
import CreateForm from "../../categories/Create";
import EditForm from "./Edit";

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

const Categories = (props: Props) => {
    const [user, setUser] = useState<Profile>();
    const [category, setCategory] = useState<Category>();
    const [modals, setModals] = useState({
        edit: false,
        create: false,
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

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
    }, []);

    const toggleEditUser = useCallback(() => {
        setModals(modals => ({
            ...modals,
            editUser: !modals.editUser
        }));
    }, []);

    const handleEdit = useCallback((item: Category) => {
        setCategory(item);
        toggleEdit();
    }, []);

    const handleEditUser = useCallback((user: Profile) => {
        setUser(user);
        toggleEditUser();
    }, []);

    const categories = useFindCategories(['categories', ...filters], filters, orderBy, limit);

    return (
        <>
            <div className="level">
                <div className="level-left">
                    <div className="is-size-2"><b><i className="la la-list"/> Categories</b></div>
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
                                Age
                            </div>
                        </div>
                    </div>
                    <div className="body">
                        {categories.isSuccess && categories.data && 
                            categories.data.map((item, index) => 
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
                                        <TimeFromNow date={item.createdAt}/>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>

            <div className="level mt-5">
                <div className="level-left">
                </div>
                <div className="level-right">
                    <Button 
                        onClick={toggleCreate}
                    >
                        <i className="la la-plus-circle" />&nbsp;Create
                    </Button>
                </div>
            </div>

            <Modal
                header={<span>Create category</span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    onClose={toggleCreate}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                />
            </Modal>
            
            <Modal
                header={<span>Edit category</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {category &&
                    <EditForm
                        category={category}
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

export default Categories;