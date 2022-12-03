import React from "react";
import { FormattedMessage } from "react-intl";
import { currencyOptions } from "../libs/payment";

interface Props {
    ids?: string[];
    names?: string[];
    label?: string;
    placeholder?: string;
    title?: string;
    values: any[];
    disabled?: boolean;
    required?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
};

const CurrencyField = (props: Props) => {
    const {ids, names} = props;

    return (
        <div>
            {props.label &&
                <label className="label">
                    <FormattedMessage id={props.label} defaultMessage={props.label} />
                </label>
            }
            <div className="field has-addons">
                <div className="control">
                    <div className="select">
                        <select 
                            className="input is-clickable"
                            id={ids? ids[0]: undefined}
                            name={names? names[0]: undefined}
                            value={props.values[0]}
                            required={props.required}
                            disabled={props.disabled}
                            onChange={props.onChange}
                        >
                            {currencyOptions.map((opt) => 
                                <option key={opt.value} value={opt.value}>{opt.label}</option>)
                            }
                        </select>
                    </div>
                </div>
                <div className="control is-expanded">
                    <input 
                        className="input"
                        id={ids? ids[1]: undefined}
                        name={names? names[1]: undefined}
                        placeholder={props.placeholder}
                        title={props.title}
                        value={props.values[1]} 
                        type="text"
                        required={props.required}
                        disabled={props.disabled}
                        onChange={props.onChange}
                    />
                </div>
            </div>
        </div>
    );
};


export default CurrencyField;