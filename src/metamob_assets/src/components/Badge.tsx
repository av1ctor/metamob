import React from 'react';

interface Props {
    color?: string;
    title?: string;
    isRect?: boolean;
    isLarge?: boolean;
    className?: string;
    children: any
};

const Badge = (props: Props) => {
    return (
        <small 
            className={`tag ${props.isLarge? 'is-large': ''} ${props.isRect? '': 'is-rounded'} is-${props.color ?? 'success'} ${props.className}`}
            title={props.title}
        >
            <span className="tag-children">
                {props.children}
            </span>
        </small>
    );
};

export default Badge;