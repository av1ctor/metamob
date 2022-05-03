import React from "react";

interface Option {
    name: string;
    value: any;
}

interface Props {
    id?: string;
    name?: string;
    label: string;
    value: string | number;
    options: Option[];
    disabled?: boolean;
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
};

const SelectField = (props: Props) => {
    return (
        <div className="relative mt-2 mb-4 flex-1">
            <div 
                className="absolute left-2 px-1 text-xs hide-label-line" 
                style={{top: '-0.5rem'}}
            >
                {props.label}
            </div>
            <select 
                className="border rounded-md px-2 py-1 bg-white hover:border-gray-400 w-full"
                id={props.id}
                name={props.name}
                value={props.value} 
                disabled={props.disabled}
                onChange={props.onChange}
            >
            {([{name:"", value:""}]).concat(props.options || []).map((opt, index) => 
                <option key={index} value={opt.value}>
                    {opt.name}
                </option>
            )}
            </select>
        </div>
    );
};


export default SelectField;