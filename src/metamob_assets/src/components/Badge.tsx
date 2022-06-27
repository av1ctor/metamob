import React from 'react';

interface Props {
    color?: string;
    title?: string;
    children: any
};

const Badge = (props: Props) => {
    return (
        <small 
            className={`tag is-rounded is-${props.color ?? 'success'}`}
            title={props.title}
        >
            {props.children}
        </small>
    );
};

export default Badge;