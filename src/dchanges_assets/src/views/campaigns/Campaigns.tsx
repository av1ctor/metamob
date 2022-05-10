import React, {useState, useCallback, useContext} from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../../components/Modal";
import { AuthContext } from "../../stores/auth";
import {CategoryContext} from "../../stores/category";
import {Filter} from "../../libs/common";
import {useFindCampaigns, useCreateCampaign} from "../../hooks/campaigns";
import CreateForm from "./Create";
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
}

const Campaigns = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [categoryState, ] = useContext(CategoryContext);

    const [filters, setFilters] = useState<Filter>({
        key: 'title',
        op: 'contains',
        value: ''
    });
    const [modals, setModals] = useState({
        create: false,
    });

    const navigate = useNavigate();

    const queryKey = ['campaigns', filters.key, filters.op, filters.value, orderBy.key, orderBy.dir];

    const campaigns = useFindCampaigns(queryKey, filters, orderBy, limit);
    const createCampaignMut = useCreateCampaign();

    const searchCampaigns = useCallback((filters: React.SetStateAction<Filter>) => {
        setFilters(filters);
    }, [filters]);

    const toggleCreate = useCallback(() => {
        setModals({
            ...modals,
            create: !modals.create
        });
    }, [modals]);

    const redirectToLogon = useCallback(() => {
        navigate('/user/login');
    }, []);

    const isLoggedIn = !!authState.user;

    return (
        <div className="container">
            <div>
                <div>
                    <div className="level">
                        <div className="level-left">
                            <SearchForm 
                                    filters={filters}
                                    indexedColumns={indexedColumns}
                                    onSearch={searchCampaigns} 
                                />
                        </div>
                        <div className="level-right">
                            <Button onClick={isLoggedIn? toggleCreate: redirectToLogon}>Create</Button>
                        </div>
                    </div>

                    <div>
                        {campaigns.status === 'loading' &&
                            <div>
                                Loading...
                            </div>
                        }

                        {campaigns.status === 'error' &&
                            <div className="form-error">
                                {campaigns.error.message}
                            </div>
                        }
                        
                        <div className="columns is-desktop is-multiline">
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
                isOpen={modals.create}
                onClose={toggleCreate}
            >
                <CreateForm
                    categories={categoryState.categories}
                    mutation={createCampaignMut}
                    onCancel={toggleCreate}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                />
            </Modal>

        </div>
    );
};

export default Campaigns;
  