import React, { ReactNode, useCallback, useState } from "react";

interface CustomOption {
    name: string;
    value: any;
    node: ReactNode;
}

interface Props {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    title?: string;
    value: string | number;
    options: CustomOption[];
    leftIcon?: string;
    required?: boolean;
    disabled?: boolean;
    onChange?: (e: any) => void;
};

const CustomSelectField = (props: Props) => {
    const [isVisible, setIsVisible] = useState(false);

    const handleChange = useCallback((e: any) => {
        e.preventDefault();
        let elm = e.target;
        while(elm) {
            const value = elm.dataset.value;
            if(value !== undefined) {
                setIsVisible(false);
                if(props.onChange) {
                    props.onChange({
                        target: {
                            id: props.id, 
                            name: props.name, 
                            value: value,
                        }
                    });
                }
                break;
            }

            elm = elm.parentNode;
        }
    }, [props.onChange, props.id, props.name]);

    const handleShowMenu = useCallback((e: any) => {
        e.preventDefault();
        setIsVisible(true);
    }, []);

    const handleHideMenu = useCallback((e: any) => {
        e.preventDefault();
        if (!e.relatedTarget || 
            !e.relatedTarget.classList.contains('dropdown-item')) {
            setIsVisible(false);
        }
    }, []);

    const value = (props.options.find(opt => opt.value == props.value) || {}).name || '';

    return (
        <div className="field">
            {props.label && 
                <label className="label">
                    {props.label}
                </label>
            }
            <div className="dropdown is-flex">
                <div 
                    className={`control dropdown-trigger is-flex-grow-1 ${props.leftIcon? 'has-icons-left': ''}`}
                >
                    <button 
                        className="button has-icons-right is-fullwidth is-flex" 
                        disabled={props.disabled}
                        onClick={handleShowMenu}
                        onBlur={handleHideMenu}
                    >
                        <div className="is-flex-grow-1 has-text-left">
                            <span>{value || props.placeholder}</span>
                        </div>
                        <span className="icon is-small is-right">
                                <i className="la la-angle-down"/>
                            </span>
                    </button>
                    {props.leftIcon && 
                        <span className="icon is-left">
                            <i className={`la la-${props.leftIcon}`}></i>
                        </span>
                    }
                </div>
                <div
                    className={`dropdown-menu ${isVisible? 'is-block': ''}`}
                >
                    {props.options.map((opt, index) => 
                        <a 
                            key={index} 
                            className="dropdown-item"
                            href="#"
                            data-value={opt.value}
                            onClick={handleChange}
                        >
                            {opt.node}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomSelectField;