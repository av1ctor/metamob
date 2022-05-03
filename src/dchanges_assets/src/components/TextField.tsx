import React from "react";

interface Props {
    id?: string;
    name?: string;
    label?: string;
    value: string;
    disabled?: boolean;
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
            <div className="control">
                <input 
                    className="input"
                    id={props.id}
                    name={props.name}
                    value={props.value} 
                    type="text"
                    disabled={props.disabled}
                    onChange={props.onChange}
                />
            </div>
        </div>
    );
};


export default TextField;