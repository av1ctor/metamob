import React, { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import { Variant } from "../../../declarations/metamob/metamob.did";
import { getVariantType, stringToVariant, variantOptions, variantToString, VariantType } from "../libs/variant";

interface Props {
    id?: string;
    name?: string;
    label?: string;
    title?: string;
    value: Variant;
    disabled?: boolean;
    required?: boolean;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
};

const VariantField = (props: Props) => {
    const [type, setType] = useState<VariantType>(() => getVariantType(props.value));
    const [value, setValue] = useState<string>(() => variantToString(props.value));
    
    const handleChangeType = useCallback((e: any) => {
        setType(Number.parseInt(e.target.value));
    }, []);

    const handleChangeValue = useCallback((e: any) => {
        const variant = stringToVariant(e.target.value, type);
        if(props.onChange) {
            props.onChange({
                target: {
                    id: props.id,
                    name: props.name,
                    value: variant
                } as any
            } as any);
        }
    }, [props.onChange, props.id, props.name, type]);

    useEffect(() => {
        setValue(variantToString(props.value));
    }, [props.value]);
    
    return (
        <>
            {props.label &&
                <div className="field">
                    <label className="label">
                        <FormattedMessage id={props.label} defaultMessage={props.label} />
                    </label>
                </div>
            }
            <div className="field is-grouped">
                <div className="control">
                    <select
                        className="input is-clickable"
                        name="type"
                        value={type}
                        onChange={handleChangeType}
                    >
                        {variantOptions.map((opt, index) => 
                            <option key={index} value={opt.value}>{opt.name}</option>)
                        }
                    </select>
                </div>
                <div className="control is-expanded">
                    <input 
                        className="input is-fullwidth"
                        id={props.id}
                        name={props.name}
                        title={props.title}
                        value={value} 
                        type="text"
                        required={props.required}
                        disabled={props.disabled}
                        onChange={handleChangeValue}
                    />
                </div>
            </div>
        </>
    );
};

export default VariantField;