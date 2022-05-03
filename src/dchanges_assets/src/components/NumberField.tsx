import React from "react";

interface Props {
    id?: string;
    name?: string;
    label: string;
    value: number;
    disabled?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

const NumberField = (props: Props) => {
    return (
        <div className="field">
            <label className="label">
                {props.label}
            </label>
            <div className="control">
                <input 
                    className="input"
                    id={props.id}
                    name={props.name}
                    value={props.value} 
                    type="number"
                    disabled={props.disabled}
                    onChange={props.onChange}
                />
            </div>
        </div>
    );
};


export default NumberField;