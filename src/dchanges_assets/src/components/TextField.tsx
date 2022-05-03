import React from "react";

interface Props {
    id?: string;
    name?: string;
    label: string;
    value: string;
    disabled?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

const TextField = (props: Props) => {
    return (
        <div className="relative mt-2 mb-4 flex-1">
            <div 
                className="absolute left-2 px-1 text-xs hide-label-line" 
                style={{top: '-0.5rem'}}
            >
                {props.label}
            </div>
            <input 
                className="border rounded-md px-2 py-1 bg-white hover:border-gray-400 w-full"
                id={props.id}
                name={props.name}
                value={props.value} 
                type="text"
                disabled={props.disabled}
                onChange={props.onChange}
            />
        </div>
    );
};


export default TextField;