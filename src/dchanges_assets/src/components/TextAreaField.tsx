import React from "react";

interface Props {
    id?: string;
    name?: string;
    label: string;
    value: string;
    disabled?: boolean;
    rows: number;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
};

const TextAreaField = (props: Props) => {
    return (
        <div className="field">
            <label className="label">
                {props.label}
            </label>
            <div className="control">
                <textarea 
                    className="textarea"
                    id={props.id}
                    name={props.name}
                    value={props.value} 
                    rows={props.rows}
                    disabled={props.disabled}
                    onChange={props.onChange}
                />
            </div>
        </div>
    );
};


export default TextAreaField;