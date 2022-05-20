import React, {useState, useCallback, useEffect} from "react";
import {Filter} from "../../libs/common";
import {useFindCampaignsByPlaceId} from "../../hooks/campaigns";
import Item from "../campaigns/Item";
import { Bar } from "../campaigns/Bar";
import { useParams } from "react-router-dom";
import { useFindPlaceByPubId } from "../../hooks/places";
import { PlaceBar } from "./place/PlaceBar";

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

const Place = (props: Props) => {
    const {id} = useParams();

    const [placeId, setPlaceId] = useState<number>();
    const [filters, setFilters] = useState<Filter[]>([
        {
            key: 'title',
            op: 'contains',
            value: ''
        }
    ]);

    const place = useFindPlaceByPubId(id);

    const campaigns = useFindCampaignsByPlaceId(filters, orderBy, limit, placeId);

    const handleChangeFilters = useCallback((filters: Filter[]) => {
        setFilters(filters);
    }, []);

    useEffect(() => {
        if(place.status === "success") {
            setPlaceId(place.data._id);
        }
    }, [place.status]);

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
                    <PlaceBar
                        place={place.data}
                    />
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

export default Place;
  