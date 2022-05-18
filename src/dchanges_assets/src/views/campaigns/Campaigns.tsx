import React, {useState, useCallback, useContext, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { AuthContext } from "../../stores/auth";
import {CategoryContext} from "../../stores/category";
import {Filter} from "../../libs/common";
import {useFindCampaigns, useCreateCampaign} from "../../hooks/campaigns";
import CreateForm from "./campaign/Create";
import SearchForm from "./Search";
import Item from "./Item";
import Button from "../../components/Button";

const indexedColumns = ['title'];

const orderBy = {
    key: '_id',
    dir: 'desc'
};

const limit = {
    offset: 0,
    size: 10
};

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const Campaigns = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [categoryState, ] = useContext(CategoryContext);

    const [filters, setFilters] = useState<Filter[]>([
        {
            key: 'title',
            op: 'contains',
            value: ''
        }
    ]);
    const [modals, setModals] = useState({
        create: false,
    });

    const navigate = useNavigate();

    const queryKey = ['campaigns', filters[0].key, filters[0].op, filters[0].value, orderBy.key, orderBy.dir];

    const campaigns = useFindCampaigns(queryKey, filters, orderBy, limit);
    const createCampaignMut = useCreateCampaign();

    const searchCampaigns = useCallback((filters: Filter) => {
        setFilters([filters]);
    }, []);

    const toggleCreate = useCallback(() => {
        setModals(modals => ({
            ...modals,
            create: !modals.create
        }));
    }, []);

    const redirectToLogon = useCallback(() => {
        navigate('/user/login');
    }, []);

    useEffect(() => {
        props.toggleLoading(campaigns.status === "loading");
        if(campaigns.status === "error") {
            props.onError(campaigns.error.message);
        }
    }, [campaigns.status]);

    const isLoggedIn = !!authState.user;

    return (
        <div className="container">
            <div>
                <div>
                    <div className="level">
                        <div className="level-left">
                            <SearchForm 
                                filters={filters[0]}
                                indexedColumns={indexedColumns}
                                onSearch={searchCampaigns} 
                            />
                        </div>
                        <div className="level-right">
                            <Button 
                                onClick={isLoggedIn? toggleCreate: redirectToLogon}
                            >
                                <i className="la la-plus-circle" />&nbsp;Create
                            </Button>
                        </div>
                    </div>

                    <div>
                        <div className="columns is-desktop is-multiline is-align-items-center">
                            {campaigns.status === 'success' && campaigns.data && campaigns.data.map((campaign) => 
                                <div 
                                    className="column is-half"
                                    key={campaign._id}
                                >
                                    <Item 
                                        key={campaign._id} 
                                        campaign={campaign} />
                                </div>
                            )}
                        </div>        
                    </div>
                </div>
            </div>

            <Modal
                header={<span>Create campaign</span>}
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    categories={categoryState.categories}
                    mutation={createCampaignMut}
                    onClose={toggleCreate}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>

        </div>
    );
};

export default Campaigns;
  