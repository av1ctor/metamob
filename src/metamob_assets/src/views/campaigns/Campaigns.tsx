import React, {useState, useCallback, useEffect, Fragment} from "react";
import {Filter, Order} from "../../libs/common";
import {useFindCampaignsInf} from "../../hooks/campaigns";
import Item from "./Item";
import { Bar } from "./Bar";
import Button from "../../components/Button";
import { sortByHot } from "./Sort";
import Skeleton from "react-loading-skeleton";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../hooks/ui";

interface Props {
}

const Campaigns = (props: Props) => {
    const {toggleLoading, showSuccess, showError} = useUI();
    
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
    const [orderBy, setOrderBy] = useState(sortByHot);

    const campaigns = useFindCampaignsInf(filters, orderBy, 8);

    const handleChangeFilters = useCallback((filters: Filter[]) => {
        setFilters(filters);
    }, []);

    const handleChangeSort = useCallback((orderBy: Order[]) => {
        setOrderBy(orderBy);
    }, []);

    useEffect(() => {
        toggleLoading(campaigns.status === "loading");
        if(campaigns.status === "error") {
            showError(campaigns.error.message);
        }
    }, [campaigns.status]);

    return (
        <div className="container">
            <div>
                <div>
                    <Bar
                        filters={filters}
                        orderBy={orderBy}
                        onSearch={handleChangeFilters}
                        onSort={handleChangeSort}
                        
                        
                        
                    />
                    <div>
                        <div className="columns is-desktop is-multiline is-align-items-center">
                            {campaigns.status === 'success'? 
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
                                )
                            : 
                                Array.from([1,2,3,4]).map(index => 
                                    <div 
                                        className="column is-half"
                                        key={index}
                                    >
                                        <div className="image is-4by3" style={{maxHeight: '450px'}}>
                                            <Skeleton className="is-overlay" style={{position: 'absolute'}} />
                                        </div>
                                        <Skeleton height={170} />
                                    </div>
                                )
                            }
                        </div>        
                        <div className="has-text-centered">
                            <div className="control">
                                <Button
                                    disabled={!campaigns.hasNextPage || campaigns.isFetchingNextPage}
                                    onClick={() => campaigns.fetchNextPage()}
                                >
                                    <i className="la la-sync" />&nbsp;<FormattedMessage id={campaigns.hasNextPage? 'Load more': 'All loaded'} defaultMessage={campaigns.hasNextPage? 'Load more': 'All loaded'}/>
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
  