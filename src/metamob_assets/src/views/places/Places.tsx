import React, {useState, useCallback, useEffect, Fragment} from "react";
import {Filter, Order} from "../../libs/common";
import {useFindPlacesInf} from "../../hooks/places";
import Button from "../../components/Button";
import { sortByKind } from "./Sort";
import Item from "./Item";
import { Bar } from "./Bar";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const Places = (props: Props) => {
    const [filters, setFilters] = useState<Filter[]>([
        {
            key: 'name',
            op: 'contains',
            value: ''
        },
        {
            key: 'kind',
            op: 'eq',
            value: null
        },
        {
            key: 'active',
            op: 'eq',
            value: true
        },
    ]);

    const [orderBy, setOrderBy] = useState<Order[]>(sortByKind);

    const places = useFindPlacesInf(filters, orderBy, 8);

    const handleChangeFilters = useCallback((filters: Filter[]) => {
        setFilters(filters);
    }, []);

    const handleChangeSort = useCallback((orderBy: Order[]) => {
        setOrderBy(orderBy);
    }, []);

    useEffect(() => {
        props.toggleLoading(places.status === "loading");
        if(places.status === "error") {
            props.onError(places.error.message);
        }
    }, [places.status]);

    return (
        <div className="container">
            <div>
                <div>
                    <Bar
                        filters={filters}
                        orderBy={orderBy}
                        onSearch={handleChangeFilters}
                        onSort={handleChangeSort}
                        onSuccess={props.onSuccess}
                        onError={props.onError}
                        toggleLoading={props.toggleLoading}
                    />
                    <div>
                        <div className="columns is-desktop is-multiline is-align-items-center">
                            {places.status === 'success' && 
                                places.data && 
                                    places.data.pages.map((page, index) => 
                                <Fragment key={index}>
                                    {page.map((place) => 
                                        <div 
                                            className="column is-half"
                                            key={place._id}
                                        >
                                            <Item 
                                                key={place._id} 
                                                place={place} />
                                        </div>
                                    )}
                                </Fragment>
                            )}
                        </div>        
                        <div className="has-text-centered">
                            <div className="control">
                                <Button
                                    disabled={!places.hasNextPage || places.isFetchingNextPage}
                                    onClick={() => places.fetchNextPage()}
                                >
                                    <i className="la la-sync" />&nbsp;{places.hasNextPage? 'Load more': 'All loaded'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Places;
  