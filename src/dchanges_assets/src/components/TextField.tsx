import React from "react";

interface Props {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    title?: string;
    value: string;
    leftIcon?: string;
    rightIcon?: string;
    disabled?: boolean;
    required?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

const TextField = (props: Props) => {
    return (
        <div className="field">
            {props.label &&
                <label className="label">
                    {props.label}
                </label>
            }
            <div className={`control ${props.leftIcon? 'has-icons-left': ''} ${props.rightIcon? 'has-icons-right': ''}`}>
                <input 
                    className="input"
                    id={props.id}
                    name={props.name}
                    placeholder={props.placeholder}
                    title={props.title}
                    value={props.value} 
                    type="text"
                    required={props.required}
                    disabled={props.disabled}
                    onChange={props.onChange}
                />
                {props.leftIcon && 
                    <span className="icon is-left">
                        <i className={`la la-${props.leftIcon}`}></i>
                    </span>
                }
                {props.rightIcon && 
                    <span className="icon is-right">
                        <i className={`la la-${props.rightIcon}`}></i>
                    </span>
                }
            </div>
        </div>
    );
};


export default TextField;