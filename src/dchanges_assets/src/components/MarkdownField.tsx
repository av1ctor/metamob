import React, { useCallback, useMemo } from "react";
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

const MarkdownField = (props: Props) => {
    const handleOnChange = useCallback((value: string) => {
        props.onChange && props.onChange({target: {name: props.name, id: props.id, value: value}} as any);
    }, [props.onChange]);

    const options = useMemo(() => ({
        autofocus: false,
        spellChecker: false,
        status: false,
        promptURLs: true,
        hideIcons: ["side-by-side","fullscreen"]
    }), []);
        
    return (
        <div className="field">
            <label className="label">
                {props.label}
            </label>
            <div className="control">
                <SimpleMDE
                    id={props.id} 
                    value={props.value} 
                    options={options}    
                    onChange={handleOnChange}
                />
            </div>
        </div>
    );
};


export default MarkdownField;