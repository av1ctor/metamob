import React, { useCallback, useMemo } from "react";
import SimpleMDE from "react-simplemde-editor";
import 'easymde/dist/easymde.min.css';
import { FormattedMessage } from "react-intl";

interface Props {
    id?: string;
    name?: string;
    label?: string;
    value: string;
    disabled?: boolean;
    rows?: number;
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
};

const MarkdownField = (props: Props) => {
    const handleOnChange = useCallback((value: string) => {
        if(props.onChange) {
            props.onChange({
                target: {
                    name: props.name, 
                    id: props.id, 
                    value: value
                }
            } as any);
        }
    }, [props.onChange, props.id, props.name]);

    const options = useMemo((): EasyMDE.Options => ({
        autofocus: false,
        spellChecker: false,
        status: false,
        promptURLs: true,
        autoRefresh: {delay: 250},
        hideIcons: ["side-by-side","fullscreen"]
    }), []);
        
    return (
        <div className="field">
            {props.label && 
                <label className="label">
                    <FormattedMessage id={props.label} defaultMessage={props.label} />
                </label>
            }
            <div className="control">
                <SimpleMDE
                    id={props.id} 
                    value={props.value} 
                    options={options}
                    onChange={props.disabled? undefined: handleOnChange}
                />
            </div>
        </div>
    );
};


export default MarkdownField;