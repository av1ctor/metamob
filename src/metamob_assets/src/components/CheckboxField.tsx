import React from "react";

import "bulma-checkradio/dist/css/bulma-checkradio.min.css";

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

const CheckboxField = (props: Props) => {
    return (
        <div className="field">
                <input 
                    className={`is-checkradio is-circle is-${props.color || 'primary'}`}
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


export default CheckboxField;