import React from "react";
import { FormattedMessage } from "react-intl";

interface Props {
    id?: string;
    name?: string;
    label: string;
    value: string;
    disabled?: boolean;
    required?: boolean;
    rows: number;
    innerRef?: any;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
};

const TextAreaField = (props: Props) => {
    return (
        <div className="field">
            <label className="label">
                <FormattedMessage id={props.label} defaultMessage={props.label} />
            </label>
            <div className="control">
                <textarea 
                    ref={props.innerRef}
                    className="textarea"
                    id={props.id}
                    name={props.name}
                    value={props.value} 
                    rows={props.rows}
                    required={props.required}
                    disabled={props.disabled}
                    onChange={props.onChange}
                />
            </div>
        </div>
    );
};


export default TextAreaField;