import React, { DragEvent, useCallback } from "react";
import { FormattedMessage } from "react-intl";

interface Props {
    id?: string;
    name?: string;
    label?: string;
    value?: string;
    children?: any;
    onDrop?: (files: FileList, id?: string, name?: string) => void;
};

const FileDropArea = (props: Props) => {
    
    const handleDrop = useCallback(async (event: DragEvent<HTMLElement>) => {
        if(props.onDrop) {
            event.preventDefault();
            const dt = event.dataTransfer;
            if(dt.types.indexOf('Files') !== -1) {
                props.onDrop(dt.files, props.id, props.name);
            }
        }
    }, [props.id, props.name, props.onDrop]);

    const handleDrag = useCallback((event: any) => {
        event.preventDefault();
    }, []);
    
    return (
        <div className="field">
            {props.label &&
                <label className="label">
                    <FormattedMessage id={props.label} defaultMessage={props.label} />
                </label>
            }
            <div 
                className="file-drop-area"
                onDrop={handleDrop}
                onDragOver={handleDrag}
            >
                {props.value &&
                    <div className="value">{props.value}</div>
                }
                {props.children &&
                    <div className="preview">
                        {props.children}
                    </div>
                }
                <div className="message">
                    <FormattedMessage defaultMessage="Drop your file here" />
                </div>
                
            </div>
        </div>
    );
};


export default FileDropArea;