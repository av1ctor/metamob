import React from 'react';
import { Link } from 'react-router-dom';
import { useFindPlaceTreeById } from '../../../hooks/places';

interface Props {
    id?: number
};

const reversed = (arr: any[]) => {
    const copy = Array.from(arr);
    return copy.reverse();
}

const PlaceTree = (props: Props) => {
    const places = props.id?
        useFindPlaceTreeById(props.id):
        undefined;

    return (
        places?.isSuccess && places?.data? 
            <nav className="breadcrumb" aria-label="breadcrumbs">
                <ul className='is-size-7'>
                    {reversed(places.data).map((place, index) => 
                        <li 
                            key={place._id} 
                        >
                            <Link to={`/p/${place.pubId}`}>{place.name}</Link>
                        </li>
                    )}
                </ul>
            </nav>
        :
            null
    );
};

export default PlaceTree;