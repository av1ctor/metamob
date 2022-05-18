import React from 'react';
import { useFindPlaceById } from '../../../hooks/places';

interface Props {
    id?: number
};

const Place = (props: Props) => {
    const place = props.id?
        useFindPlaceById(['places', props.id], props.id):
        undefined;

    return (
        place?.isSuccess? 
            <span 
                className="tag is-rounded is-warning"
                title={`Place: ${place.data.name}`}
            >
                <b>{place.data.name}</b>
            </span>:
        null
    );
};

export default Place;