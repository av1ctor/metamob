import React, { ReactNode, useCallback } from "react";
import { FormattedMessage } from "react-intl";
import Button from "./Button";

interface Props {
    id?: string;
    name?: string;
    label?: string;
    title?: string;
    value: any[];
    disabled?: boolean;
    required?: boolean;
    onRenderItem: (item: any, index: number, onChange?: (value: any, index: number) => void) => ReactNode;
    onGetEmptyItem?: () => any;
    onChange?: React.ChangeEventHandler<HTMLElement>;
}

const ArrayField = (props: Props) => {
    
    const handleChange = useCallback((value: any, index: number) => {
        if(props.onChange) {
            const arr = Array.from(props.value);
            arr[index] = value;

            props.onChange({
                target: {
                    id: props.id,
                    name: props.name,
                    value: arr
                } as any
            } as any);
        }
    }, [props.onChange, props.id, props.name, props.value]);

    const handleDelete = useCallback((e: any, index: number) => {
        e.preventDefault();

        if(props.onChange) {
            const arr = Array.from(props.value);
            arr.splice(index, 1);

            props.onChange({
                target: {
                    id: props.id,
                    name: props.name,
                    value: arr
                } as any
            } as any);
        }
    }, [props.onChange, props.id, props.name, props.value]);

    const handleAdd = useCallback((e: any) => {
        e.preventDefault();

        if(props.onChange) {
            const arr = Array.from(props.value);
            if(props.onGetEmptyItem) {
                arr.push(props.onGetEmptyItem());
            }

            props.onChange({
                target: {
                    id: props.id,
                    name: props.name,
                    value: arr
                } as any
            } as any);
        }
    }, [props.onChange, props.onGetEmptyItem, props.id, props.name, props.value]);

    return (
        <div className="array-field-container p-2 border">
            {props.label &&
                <label className="label">
                    <FormattedMessage id={props.label} defaultMessage={props.label} />
                </label>
            }
            {props.value.map((item, index) => 
                <div 
                    key={index}
                    className="array-field p-2 border"
                >
                    <div 
                        className="columns is-fullwidth"
                    >
                        <div className="column">
                            {props.onRenderItem(item, index, handleChange)}
                        </div>
                        <div className="column is-1 is-flex is-align-items-center">
                            <Button
                                color="danger"
                                size="small"
                                onClick={(e) => handleDelete(e, index)}
                            >
                                <i className="la la-minus-circle"/>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <div 
                className="has-text-centered mt-2"
            >
                <Button
                    size="small"
                    onClick={handleAdd}
                >
                    <i className="la la-plus-circle"/>&nbsp;<FormattedMessage id="Add" defaultMessage="Add" />
                </Button>
            </div>
        </div>
    );
};

export default ArrayField;
