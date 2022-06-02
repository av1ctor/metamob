import React, { useCallback, useState } from "react";
import Modal from "../../../components/Modal";
import { Filter, Order } from "../../../libs/common";
import { Campaign, Profile } from "../../../../../declarations/dchanges/dchanges.did";
import TextField from "../../../components/TextField";
import { useFindCampaigns } from "../../../hooks/campaigns";
import { CampaignState, campaignStateToText } from "../../../libs/campaigns";
import TimeFromNow from "../../../components/TimeFromNow";
import EditUserForm from "../users/Edit";
import View from "./View";
import SelectField, {Option} from "../../../components/SelectField";
import { Paginator } from "../../../components/Paginator";

const orderBy: Order[] = [{
    key: '_id',
    dir: 'desc'
}];

const states: Option[] = [
    {name: 'Created', value: CampaignState.CREATED},
    {name: 'Published', value: CampaignState.PUBLISHED},
    {name: 'Finished', value: CampaignState.FINISHED},
    {name: 'Canceled', value: CampaignState.CANCELED},
    {name: 'Deleted', value: CampaignState.DELETED},
    {name: 'Banned', value: CampaignState.BANNED},
];

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const Campaigns = (props: Props) => {
    const [user, setUser] = useState<Profile>();
    const [campaign, setCampaign] = useState<Campaign>();
    const [limit, setLimit] = useState({
        offset: 0,
        size: 10
    });
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

    const handleEditCampaign = useCallback((report: Campaign) => {
        setCampaign(report);
        toggleEdit();
    }, []);

    const handleEditUser = useCallback((user: Profile) => {
        setUser(user);
        toggleEditUser();
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
                                    onClick={() => handleEditCampaign(item)}
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

            <Modal
                header={<span>Edit campaign</span>}
                isOpen={modals.edit}
                onClose={toggleEdit}
            >
                {campaign &&
                    <View
                        campaign={campaign}
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

export default Campaigns;