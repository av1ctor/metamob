import React from "react";
import { FormattedMessage } from "react-intl";

export interface Option {
    name: string;
    value: any;
}

interface Props {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    title?: string;
    value: string | number;
    options: Option[];
    leftIcon?: string;
    required?: boolean;
    disabled?: boolean;
    onChange?: (e: any) => void;
};

const SelectField = (props: Props) => {

    return (
        <div className="field">
            {props.label && 
                <label className="label">
                    <FormattedMessage id={props.label} defaultMessage={props.label} />
                </label>
            }
            <div className={`control select ${props.leftIcon? 'has-icons-left': ''}`}>
                <select 
                    className="input is-clickable"
                    id={props.id}
                    name={props.name}
                    title={props.title}
                    value={props.value} 
                    required={props.required}
                    disabled={props.disabled}
                    onChange={props.onChange}
                >
                    <option value="">
                        {props.placeholder}
                    </option>
                    {props.options.map((opt, index) => 
                        <option key={index} value={opt.value}>
                            {opt.name}
                        </option>
                    )}
                </select>
                {props.leftIcon && 
                    <span className="icon is-left">
                        <i className={`la la-${props.leftIcon}`}></i>
                    </span>
                }
            </div>
        </div>
    );
};


export default SelectField;