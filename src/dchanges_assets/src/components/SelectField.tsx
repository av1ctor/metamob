import React from "react";

export interface Option {
    name: string;
    value: any;
}

interface Props {
    id?: string;
    name?: string;
    label?: string;
    value: string | number;
    options: Option[];
    required?: boolean;
    disabled?: boolean;
    onChange?: (e: any) => void;
};

const SelectField = (props: Props) => {

    return (
        <div className="field">
            {props.label && 
                <label className="label">
                    {props.label}
                </label>
            }
            <div className="control select">
                <select 
                    className="input is-clickable"
                    id={props.id}
                    name={props.name}
                    value={props.value} 
                    required={props.required}
                    disabled={props.disabled}
                    onChange={props.onChange}
                >
                    {([{name:"", value:""}]).concat(props.options).map((opt, index) => 
                        <option key={index} value={opt.value}>
                            {opt.name}
                        </option>
                    )}
                </select>
            </div>
        </div>
    );
};


export default SelectField;