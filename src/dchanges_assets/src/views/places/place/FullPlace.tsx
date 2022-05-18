import React from 'react';
import { useFindPlaceTreeById } from '../../../hooks/places';

interface Props {
    id?: number
};

const reversed = (arr: any[]) => {
    const copy = Array.from(arr);
    return copy.reverse();
}

const FullPlace = (props: Props) => {
    const places = props.id?
        useFindPlaceTreeById(['places', 'tree', props.id], props.id):
        undefined;

    return (
        places?.isSuccess && places?.data? 
            <nav className="breadcrumb" aria-label="breadcrumbs">
                <ul className='is-size-7'>
                    {reversed(places.data).map((place, index) => 
                        <li 
                            key={place._id} 
                            className={index == places.data.length-1? 'is-active': ''}>
                                <a href="#">{place.name}</a>
                        </li>
                    )}
                </ul>
            </nav>
        :
            null
    );
};

export default FullPlace;