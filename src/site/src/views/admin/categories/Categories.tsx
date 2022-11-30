import React, { useCallback, useState } from "react";
import { saveAs } from "file-saver";
import Modal from "../../../components/Modal";
import { Filter, Order } from "../../../libs/common";
import { Category } from "../../../../../declarations/metamob/metamob.did";
import TextField from "../../../components/TextField";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindCategories } from "../../../hooks/categories";
import Button from "../../../components/Button";
import CreateForm from "../../categories/category/Create";
import EditForm from "./Edit";
import { Paginator } from "../../../components/Paginator";
import { findAll } from "../../../libs/categories";
import { JsonStringfy } from "../../../libs/utils";
import Import from "./Import";

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

interface Props {
}

const Categories = (props: Props) => {
    const [category, setCategory] = useState<Category>();
    const [limit, setLimit] = useState({
        offset: 0,
        size: 10
    });
    const [modals, setModals] = useState({
        edit: false,
        create: false,
        import: false,
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

    const handleEdit = useCallback((item: Category) => {
        setCategory(item);
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
        saveAs(blob, "categories.json");
    }, []);

    const toggleImport = useCallback(() => {
        setModals(modals => ({
            ...modals,
            import: !modals.import
        }));
    }, []);

    const categories = useFindCategories(filters, orderBy, limit);

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
                <Paginator
                    limit={limit}
                    length={categories.data?.length}
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
                            onClick={toggleCreate}
                        >
                            <i className="la la-plus-circle" />&nbsp;Create
                        </Button>
                        <Button 
                            color="warning"
                            onClick={toggleImport}
                        >
                            <i className="la la-arrow-circle-up" />&nbsp;Import
                        </Button>
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
                header={<span>Create category</span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    onClose={toggleCreate}
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
                        onClose={toggleEdit}
                    />
                }
            </Modal>

            <Modal
                header={<span>Import categories</span>}
                isOpen={modals.import}
                onClose={toggleImport}
            >
                <Import
                    onClose={toggleImport}
                />
            </Modal>
        </>
    );
};

export default Categories;