import React from 'react';

interface Props {
    id?: string
};

const Tag = (props: Props) => {
    return (
        <small 
            className='tag'
            title={`Tag: #${props.id}`}
        >
            #{props.id}
        </small>
    );
};

export default Tag;