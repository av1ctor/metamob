import React from "react";

interface Props {
    id?: string;
    name?: string;
    label?: string;
    color?: string;
    value: boolean;
    disabled?: boolean;
    required?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

const SwitchField = (props: Props) => {
    return (
        <div className="field">
                <input 
                    className={`switch is-${props.color || 'primary'}`}
                    id={props.id}
                    name={props.name}
                    checked={props.value} 
                    type="checkbox"
                    required={props.required}
                    disabled={props.disabled}
                    onChange={props.onChange}
                />
                {props.label &&
                    <label htmlFor={props.id || props.name}>
                        <b>{props.label}</b>
                    </label>
                }
        </div>
    );
};


export default SwitchField;