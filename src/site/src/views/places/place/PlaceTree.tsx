import React from 'react';
import { Link } from 'react-router-dom';
import { useFindPlaceTreeById } from '../../../hooks/places';

interface Props {
    id?: number;
    skipLast?: boolean;
};

const reversed = (arr: any[]) => {
    const copy = Array.from(arr);
    return copy.reverse();
}

const PlaceTree = (props: Props) => {
    const places = useFindPlaceTreeById(props.id);

    return (
        places?.isSuccess && places?.data? 
            <nav className="breadcrumb" aria-label="breadcrumbs">
                <ul className='is-size-7'>
                    {reversed(places.data).map((place, index) => 
                        props.skipLast && index === places.data.length -1?
                            undefined
                        :
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