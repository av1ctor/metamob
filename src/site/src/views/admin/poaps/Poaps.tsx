import React, { useCallback, useState } from "react";
import Modal from "../../../components/Modal";
import { Filter, Order } from "../../../libs/common";
import { Poap } from "../../../../../declarations/metamob/metamob.did";
import TextField from "../../../components/TextField";
import TimeFromNow from "../../../components/TimeFromNow";
import { useFindPoaps } from "../../../hooks/poap";
import EditForm from "../../poaps/poap/Edit";
import { Paginator } from "../../../components/Paginator";
import { findAll } from "../../../libs/poap";
import { JsonStringfy } from "../../../libs/utils";
import saveAs from "file-saver";
import Button from "../../../components/Button";

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

interface Props {

}

const Poaps = (props: Props) => {
    const [poap, setPoap] = useState<Poap>();
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
        setModals(modals => ({
            ...modals,
            edit: !modals.edit
        }));
    }, []);

    const handleEdit = useCallback((item: Poap) => {
        setPoap(item);
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
        saveAs(blob, "poaps.json");
    }, []);

    const poaps = useFindPoaps(filters, orderBy, limit);

    return (
        <>
            <div className="level">
                <div className="level-left">
                    <div className="is-size-2"><b><i className="la la-list"/> Poaps</b></div>
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
                            <div className="column">
                                Canister Id
                            </div>
                            <div className="column is-1">
                                Age
                            </div>
                        </div>
                    </div>
                    <div className="body">
                        {poaps.isSuccess && poaps.data && 
                            poaps.data.map((item, index) => 
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
                                    <div className="column">
                                        {item.canisterId}
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
                    length={poaps.data?.length}
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
                header={<span>Edit poap</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {poap &&
                    <EditForm
                        campaignId={poap.campaignId}
                        poap={poap}
                        onClose={toggleEdit}
                    />
                }
            </Modal>
        </>
    );
};

export default Poaps;