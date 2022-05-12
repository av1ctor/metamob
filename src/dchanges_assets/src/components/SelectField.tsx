import React, { useCallback, useEffect, useState } from "react";

export interface Option {
    name: string;
    value: any;
}

interface Props {
    id?: string;
    name?: string;
    label?: string;
    value: string | number;
    options: Option[] | ((value: string | number) => Promise<Option[]>);
    required?: boolean;
    disabled?: boolean;
    onChange?: React.ChangeEventHandler<HTMLSelectElement>;
};

const SelectField = (props: Props) => {
    const [options, setOptions] = useState<Option[]>([]);
    
    const getOptions = useCallback(async () => {
        if(Array.isArray(props.options)) {
            setOptions(props.options);
        }
        else {
            const options = await props.options(props.value);
            setOptions(options);
        }
    }, [props.options]);
    
    useEffect(() => {
        getOptions();
    }, [getOptions]);

    return (
        <div className="field">
            {props.label && 
                <label className="label">
                    {props.label}
                </label>
            }
            <div className="control">
                <div className="select">
                    <select 
                        id={props.id}
                        name={props.name}
                        value={props.value} 
                        required={props.required}
                        disabled={props.disabled}
                        onChange={props.onChange}
                    >
                        {([{name:"", value:""}]).concat(options).map((opt, index) => 
                                <option key={index} value={opt.value}>
                                    {opt.name}
                                </option>
                            )
                        }
                    </select>
                </div>
            </div>
        </div>
    );
};


export default SelectField;