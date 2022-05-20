import React, {useState, useCallback, useEffect} from "react";
import {Filter} from "../../libs/common";
import {useFindCampaigns} from "../../hooks/campaigns";
import Item from "./Item";
import { Bar } from "./Bar";

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
    const [filters, setFilters] = useState<Filter[]>([
        {
            key: 'title',
            op: 'contains',
            value: ''
        },
        {
            key: 'categoryId',
            op: 'eq',
            value: null
        }
    ]);

    const campaigns = useFindCampaigns(filters, orderBy, limit);

    const handleChangeFilters = useCallback((filters: Filter[]) => {
        setFilters(filters);
    }, []);

    useEffect(() => {
        props.toggleLoading(campaigns.status === "loading");
        if(campaigns.status === "error") {
            props.onError(campaigns.error.message);
        }
    }, [campaigns.status]);

    return (
        <div className="container">
            <div>
                <div>
                    <Bar
                        filters={filters}
                        onSearch={handleChangeFilters}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
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

        </div>
    );
};

export default Campaigns;
  