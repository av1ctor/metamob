import React, { useCallback, useEffect, useRef } from "react";
import BulmaTagsInput from '@creativebulma/bulma-tagsinput';

interface Props {
    label?: string;
    id?: string;
    name?: string;
    maxTags?: number;
    value: string[];
    onChange: (e: any) => void;
}

const TagsField = (props: Props) => {
    const inpRef = useRef(null);

    const handleChange = useCallback((value: string[]) => {
        props.onChange({target: {id: props.id, name: props.name, value: value}})
    }, [props.onChange]);

    const fakeChange = useCallback((e: any) => {
    }, []);

    useEffect(() => {
        if(inpRef.current) {
            const bti = new BulmaTagsInput(inpRef.current, {
                caseSensitive: false,
                maxTags: props.maxTags || 5,
            });
            bti.on('after.add', (): any => {
                const value = typeof bti.value === 'string'? bti.value.split(','): bti.value;
                handleChange(value);
            });
            bti.on('after.remove', (): any => {
                const value = typeof bti.value === 'string'? bti.value.split(','): bti.value;
                handleChange(value);
            });            
        }
    }, [inpRef.current])
    
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
                    ref={inpRef}
                    value={props.value}
                    multiple
                    onChange={fakeChange}
                />
            </div>
        </div>
    );
};

export default TagsField;