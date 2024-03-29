import React, { useCallback, useState } from "react";
import Modal from "../../../components/Modal";
import { Filter, Order } from "../../../libs/common";
import { Campaign, Profile } from "../../../../../declarations/metamob/metamob.did";
import TextField from "../../../components/TextField";
import { useFindCampaigns } from "../../../hooks/campaigns";
import { campaignStateToText, findAll, stateOptions } from "../../../libs/campaigns";
import TimeFromNow from "../../../components/TimeFromNow";
import EditUserForm from "../users/Edit";
import View from "./View";
import SelectField from "../../../components/SelectField";
import { Paginator } from "../../../components/Paginator";
import Button from "../../../components/Button";
import { JsonStringfy } from "../../../libs/utils";
import saveAs from "file-saver";
import Import from "./Import";

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

interface Props {
}

const Campaigns = (props: Props) => {
    const [user, setUser] = useState<Profile>();
    const [campaign, setCampaign] = useState<Campaign>();
    const [limit, setLimit] = useState({
        offset: 0,
        size: 10
    });
    const [modals, setModals] = useState({
        view: false,
        editUser: false,
        import: false,
    });
    const [filters, setFilters] = useState<Filter[]>([
        {
            key: 'pubId',
            op: 'eq',
            value: ''
        },
        {
            key: 'title',
            op: 'contains',
            value: ''
        },
        {
            key: 'state',
            op: 'eq',
            value: null
        },
    ]);

    const handleChangePubIdFilter = useCallback((e: any) => {
        const value = e.target.value;
        setFilters(filters => 
            filters.map(f => f.key !== 'pubId'? f: {...f, value: value})
        );
    }, []);

    const handleChangeTitleFilter = useCallback((e: any) => {
        const value = e.target.value;
        setFilters(filters => 
            filters.map(f => f.key !== 'title'? f: {...f, value: value})
        );
    }, []);

    const handleChangeStateFilter = useCallback((e: any) => {
        const value = e.target.value === ''? 
            null:
            Number(e.target.value);
        setFilters(filters => 
            filters.map(f => f.key !== 'state'? f: {...f, value: value})
        );
    }, []);
    
    const toggleView = useCallback(() => {
        setModals(modals => ({
            ...modals,
            view: !modals.view
        }));
    }, []);

    const toggleEditUser = useCallback(() => {
        setModals(modals => ({
            ...modals,
            editUser: !modals.editUser
        }));
    }, []);

    const handleView = useCallback((campaign: Campaign) => {
        setCampaign(campaign);
        toggleView();
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
        saveAs(blob, "campaigns.json");
    }, []);

    const toggleImport = useCallback(() => {
        setModals(modals => ({
            ...modals,
            import: !modals.import
        }));
    }, []);

    const campaigns = useFindCampaigns(filters, orderBy, limit);

    return (
        <>
            <div className="level">
                <div className="level-left">
                    <div className="is-size-2"><b><i className="la la-volume-up"/> Campaigns</b></div>
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
                        <b>Title</b>
                        <TextField
                            name="title"
                            value={filters[1].value}
                            onChange={handleChangeTitleFilter}
                        />
                    </div>
                    <div className="ml-2">
                        <b>State</b>
                        <SelectField
                            name="state"
                            value={filters[2].value !== null? filters[2].value: ''}
                            options={stateOptions}
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
                                Title
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
                        {campaigns.isSuccess && campaigns.data && 
                            campaigns.data.map((item, index) => 
                                <div 
                                    className="columns" 
                                    key={index}
                                    onClick={() => handleView(item)}
                                >
                                    <div className="column is-2 is-size-7">
                                        {item.pubId}
                                    </div>
                                    <div className="column">
                                        {item.title}
                                    </div>
                                    <div className="column is-1">
                                        {campaignStateToText(item.state)}
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
                    length={campaigns.data?.length}
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
                header={<span>View campaign</span>}
                isOpen={modals.view}
                onClose={toggleView}
            >
                {campaign &&
                    <View
                        campaign={campaign}
                        onClose={toggleView}
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

            <Modal
                header={<span>Import campaigns</span>}
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

export default Campaigns;