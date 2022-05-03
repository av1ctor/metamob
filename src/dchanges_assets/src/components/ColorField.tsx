import React from "react";

interface Props {
    id?: string;
    name?: string;
    label: string;
    value: string;
    disabled?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

const ColorField = (props: Props) => {
    return (
        <div className="field">
            <label className="label" >
                {props.label}
            </label>
            <div className="control">
                <input 
                    className="input-color"
                    id={props.id}
                    name={props.name}
                    value={props.value} 
                    type="color"
                    disabled={props.disabled}
                    onChange={props.onChange}
                />
            </div>
        </div>
    );
};


export default ColorField;