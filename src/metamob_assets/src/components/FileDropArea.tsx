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

    const handleFileSelected = useCallback((event: any) => {
        event.preventDefault();
        if(props.onDrop) {
            props.onDrop(event.target.files, props.id, props.name);
        }
    }, [props.id, props.name, props.onDrop]);
    
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
                    <input 
                        type="file"  
                        accept=".svg,image/svg+xml"
                        onChange={handleFileSelected}
                    />
                    <br/>
                    <FormattedMessage defaultMessage="Or drop your file here" />
                </div>
                
            </div>
        </div>
    );
};


export default FileDropArea;