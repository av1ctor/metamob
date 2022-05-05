import React, { useCallback } from "react";
import SimpleMDE from "react-simplemde-editor";
import 'easymde/dist/easymde.min.css';

interface Props {
    id?: string;
    name?: string;
    label: string;
    value: string;
    disabled?: boolean;
    rows: number;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
};

const options = {
    autofocus: false,
    spellChecker: false,
    status: false,
};

const MarkdownField = (props: Props) => {
    const handleOnChange = useCallback((value: string) => {
        props.onChange && props.onChange({target: {name: props.name, id: props.id, value: value}} as any);
    }, [props.onChange]);
    
    return (
        <div className="field">
            <label className="label">
                {props.label}
            </label>
            <div className="control">
                <SimpleMDE 
                    value={props.value} 
                    options={options}    
                    onChange={handleOnChange}
                />
            </div>
        </div>
    );
};


export default MarkdownField;