import React from 'react';
import { useFindRegionById } from '../../../hooks/regions';

interface Props {
    id?: number
};

const Region = (props: Props) => {
    const region = props.id?
        useFindRegionById(['regions', props.id], props.id):
        undefined;

    return (
        region?.isSuccess? 
            <span 
                className="tag is-rounded is-warning"
                title={`Region: ${region.data.name}`}
            >
                <b>{region.data.name}</b>
            </span>:
        null
    );
};

export default Region;