import React from 'react';

interface Props {
    title?: string,
    color?: string,
    className?: string,
    disabled?: boolean,
    size?: string,
    onClick?: React.MouseEventHandler<HTMLButtonElement>,
    children: any
};

const Button = (props: Props) => {
    return (
        <button
            className={`${props.className} button is-${props.color || 'primary'} is-${props.size || 'normal'}`}
            title={props.title}
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    );
};

export default Button;