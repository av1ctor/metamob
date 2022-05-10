import React from 'react';

interface Props {
    id?: string
};

const Tag = (props: Props) => {
    return (
        <small className='tag'>#{props.id}</small>
    );
};

export default Tag;