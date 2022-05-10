import React, { useCallback, useState } from "react";

interface Props {
    label?: string;
    id?: string;
    name?: string;
    maxTags?: number;
    value: string[];
    onChange: (e: any) => void;
}

const TagsField = (props: Props) => {
    const [value, setValue] = useState('');

    const handleChange = useCallback((e: any) => {
        setValue(e.target.value);
    }, []);

    const handleInsert = useCallback(() => {
        const arr = new Set(props.value);
        arr.add(value);
        setValue('');
        props.onChange({target: {id: props.id, name: props.name, value: Array.from(arr)}})
    }, [props.onChange, props.value, value]);

    const handleDelete = useCallback((index: number) => {
        const arr = Array.from(props.value);
        arr.splice(index, 1);
        props.onChange({target: {id: props.id, name: props.name, value: arr}})
    }, [props.onChange, props.value]);

    const handleKeyDown = useCallback((e: any) => {
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                handleInsert();
                break;   
        }
    }, [handleInsert]);

    return (
        <div className="field">
            {props.label &&
                <label className="label">
                    {props.label}
                </label>
            }
            <div className="control">
                <div className="tags-input">
                    {props.value.map((val, index) => 
                        <span key={val} className="tag is-rounded">
                            {val}
                            <div className="delete is-small" onClick={() => handleDelete(index)}></div>
                        </span>
                    )}
                </div>
                <input 
                    className="input"
                    type="text"
                    value={value}
                    disabled={props.value.length >= (props.maxTags || Number.MAX_SAFE_INTEGER)}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                />
            </div>
        </div>
    );
};

export default TagsField;