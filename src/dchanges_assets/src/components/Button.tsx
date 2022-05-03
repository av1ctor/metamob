import React from 'react';

interface Props {
    color?: string,
    disabled?: boolean,
    onClick?: React.MouseEventHandler<HTMLButtonElement>,
    children: any
};

const Button = (props: Props) => {
    return (
        <button
            className={`button is-${props.color || 'primary'}`}
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    );
};

export default Button;