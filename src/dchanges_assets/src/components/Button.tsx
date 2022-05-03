import React from 'react';

interface Props {
    disabled?: boolean,
    onClick?: React.MouseEventHandler<HTMLButtonElement>,
    children: any
};

const Button = (props: Props) => {
    return (
        <button
            className="text-center border-2 border-gray-100 hover:border-gray-200 rounded-lg px-4 py-1 bg-gray-50 hover:bg-gray-100 font-semibold w-full"
            disabled={props.disabled}
            onClick={props.onClick}
        >
            {props.children}
        </button>
    );
};

export default Button;