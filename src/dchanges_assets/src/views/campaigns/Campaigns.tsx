import React, {useState, useCallback, useEffect, Fragment} from "react";
import {Filter} from "../../libs/common";
import {useFindCampaignsInf} from "../../hooks/campaigns";
import Item from "./Item";
import { Bar } from "./Bar";
import Button from "../../components/Button";

const orderBy = [
    {
        key: 'boosting',
        dir: 'desc'
    },
    {
        key: 'total',
        dir: 'desc'
    },
    {
        key: '_id',
        dir: 'desc'
    },
];

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
        },
        {
            key: 'placeId',
            op: 'eq',
            value: null
        }
    ]);

    const campaigns = useFindCampaignsInf(filters, orderBy, 4);

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
                            {campaigns.status === 'success' && 
                                campaigns.data && 
                                    campaigns.data.pages.map((page, index) => 
                                <Fragment key={index}>
                                    {page.map((campaign) => 
                                        <div 
                                            className="column is-half"
                                            key={campaign._id}
                                        >
                                            <Item 
                                                key={campaign._id} 
                                                campaign={campaign} />
                                        </div>
                                    )}
                                </Fragment>
                            )}
                        </div>        
                        <div className="has-text-centered">
                            <div className="control">
                                <Button
                                    disabled={!campaigns.hasNextPage || campaigns.isFetchingNextPage}
                                    onClick={() => campaigns.fetchNextPage()}
                                >
                                    <i className="la la-sync" />&nbsp;Load more
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Campaigns;
  