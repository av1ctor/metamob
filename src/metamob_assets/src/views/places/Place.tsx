import React, {useState, useCallback, useEffect, Fragment} from "react";
import {Filter, Order} from "../../libs/common";
import {useFindCampaignsByPlaceId} from "../../hooks/campaigns";
import Item from "../campaigns/Item";
import { Bar } from "../campaigns/Bar";
import { useParams } from "react-router-dom";
import { useFindPlaceByPubId } from "../../hooks/places";
import { PlaceBar } from "./place/PlaceBar";
import Button from "../../components/Button";
import { sortByDate } from "../campaigns/Sort";
import { ScrollToTop } from "../../components/ScrollToTop";
import Skeleton from "react-loading-skeleton";
import { FormattedMessage } from "react-intl";
import Children from "./place/Children";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const Place = (props: Props) => {
    const {id} = useParams();

    const [placeId, setPlaceId] = useState<number>();
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
    const [orderBy, setOrderBy] = useState(sortByDate);
    const [placesVisible, setPlacesVisible] = useState(true);

    const place = useFindPlaceByPubId(id);

    const campaigns = useFindCampaignsByPlaceId(filters, orderBy, 4, placeId);

    const handleChangeFilters = useCallback((filters: Filter[]) => {
        setFilters(filters);
    }, []);

    const handleChangeSort = useCallback((orderBy: Order[]) => {
        setOrderBy(orderBy);
    }, []);

    const handleTogglePlaces = useCallback(() => {
        setPlacesVisible(visible => !visible);
    }, []);

    useEffect(() => {
        if(place.status === "success") {
            setPlaceId(place.data._id);
        }
    }, [place.status, id]);

    useEffect(() => {
        props.toggleLoading(place.status === 'loading' || campaigns.status === "loading");
        if(place.status === "error") {
            props.onError(place.error.message);
        }
        if(campaigns.status === "error") {
            props.onError(campaigns.error.message);
        }
    }, [place.status, campaigns.status]);

    return (
        <>
            <ScrollToTop />
            <PlaceBar
                place={place.data}
                onSuccess={props.onSuccess}
                onError={props.onError}
                toggleLoading={props.toggleLoading}
                onTogglePlaces={handleTogglePlaces}
            />
            <Children
                visible={placesVisible}
                place={place.data}
                onSuccess={props.onSuccess}
                onError={props.onError}
                toggleLoading={props.toggleLoading}
            />
            <Bar
                place={place.data}
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
                    {campaigns.status === 'success'? 
                        campaigns.data.pages.map((page, index) => 
                            <Fragment key={index}>
                                {page.map(campaign => 
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
        </>
    );
};

export default Place;
  