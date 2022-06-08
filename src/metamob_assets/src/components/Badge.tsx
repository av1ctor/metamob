import React from 'react';

interface Props {
    color?: string;
    children: any
};

const Badge = (props: Props) => {
    return (
        <small 
            className={`tag is-rounded is-${props.color ?? 'success'}`}
        >
            {props.children}
        </small>
    );
};

export default Badge;