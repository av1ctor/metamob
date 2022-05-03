import React from "react";

interface Option {
    name: string;
    value: any;
}

interface Props {
    id?: string;
    name?: string;
    label?: string;
    value: string | number;
    options: Option[];
    disabled?: boolean;
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
};

const SelectField = (props: Props) => {
    return (
        <div className="field">
            {props.label && 
                <label className="label">
                    {props.label}
                </label>
            }
            <div className="control">
                <div className="select">
                    <select 
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
            </div>
        </div>
    );
};


export default SelectField;