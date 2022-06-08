import React from 'react';

interface Props {
    id?: string
};

const Tag = (props: Props) => {
    return (
        <small 
            className='tag is-rounded'
            title={`Tag: #${props.id}`}
        >
            #{props.id}
        </small>
    );
};

export default Tag;