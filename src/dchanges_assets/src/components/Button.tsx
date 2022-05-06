import React from 'react';

interface Props {
    title?: string,
    color?: string,
    disabled?: boolean,
    onClick?: React.MouseEventHandler<HTMLButtonElement>,
    children: any
};

const Button = (props: Props) => {
    return (
        <button
            className={`button is-${props.color || 'primary'}`}
            title={props.title}
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    );
};

export default Button;