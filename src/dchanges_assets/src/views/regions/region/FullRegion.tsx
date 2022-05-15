import React from 'react';
import { useFindRegionTreeById } from '../../../hooks/regions';

interface Props {
    id?: number
};

const FullRegion = (props: Props) => {
    const regions = props.id?
        useFindRegionTreeById(['regions', 'tree', props.id], props.id):
        undefined;

    return (
        regions?.isSuccess && regions?.data? 
            <span className="tag is-rounded is-warning">
                {regions.data.reverse().map((region, index) => 
                    <span 
                        key={index}
                    >
                        <b>{region.name}{index < regions.data.length-1? '/': ''}</b>
                    </span>            
                )}
            </span>
        :
            null
    );
};

export default FullRegion;