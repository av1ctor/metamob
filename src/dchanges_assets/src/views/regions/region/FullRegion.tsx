import React from 'react';
import { useFindRegionTreeById } from '../../../hooks/regions';

interface Props {
    id?: number
};

const reversed = (arr: any[]) => {
    const copy = Array.from(arr);
    return copy.reverse();
}

const FullRegion = (props: Props) => {
    const regions = props.id?
        useFindRegionTreeById(['regions', 'tree', props.id], props.id):
        undefined;

    return (
        regions?.isSuccess && regions?.data? 
            <nav className="breadcrumb" aria-label="breadcrumbs">
                <ul>
                    {reversed(regions.data).map((region, index) => 
                        <li key={region._id} className={index == regions.data.length-1? 'is-active': ''}><a href="#">{region.name}</a></li>
                    )}
                </ul>
            </nav>
        :
            null
    );
};

export default FullRegion;