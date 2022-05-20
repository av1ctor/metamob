import React, { useCallback, useEffect, useState } from "react";
import { string } from "yup";
import Button from "./Button";
import { Option } from "./SelectField";

interface Props {
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
    title?: string;
    value: string | number;
    leftIcon?: string;
    required?: boolean;
    disabled?: boolean;
    onSearch: (value: string) => Promise<Option[]>;
    onChange?: (e: any) => void;
    onAdd?: (value: string) => void;
};

const AutocompleteField = (props: Props) => {
    const [suggestion, setSuggestion] = useState(String(props.value));
    const [suggestions, setSuggestions] = useState<Option[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const handleChangeSuggestion = useCallback(async (e: any) => {
        const suggestion = e.target.value;
        if(suggestion.length >= 3) {
            try {
                setIsLoading(true);
                const options = await props.onSearch(suggestion);
                setSuggestions(options);
                if(options.length > 0 || props.onAdd !== undefined) {
                    setIsVisible(true);
                }
            }
            finally {
                setIsLoading(false);
            }
        }
        else if(suggestion.length === 0) {
            if(props.onChange) {
                props.onChange({
                    target: {
                        id: props.id, 
                        name: props.name, 
                        value: '',
                        text: ''
                    }
                });
            }
        }
        setSuggestion(suggestion);
    }, [props.onSearch]);

    const handleSelectSuggestion = useCallback((e: any) => {
        e.preventDefault();
        const text = e.target.text;
        const value = e.target.dataset.value;
        setSuggestion(text);
        setSuggestions([]);
        setIsVisible(false);
        if(props.onChange) {
            props.onChange({
                target: {
                    id: props.id, 
                    name: props.name, 
                    value: value,
                    text: text
                }
            });
        }
    }, [props.onChange, props.id, props.name]);

    const handleShowMenu = useCallback(() => {
        if(suggestions.length > 0) {
            setIsVisible(true);
        }
    }, [suggestions]);

    const handleHideMenu = useCallback((e: any) => {
        if (!e.relatedTarget || 
            !e.relatedTarget.classList.contains('dropdown-item')) {
            setIsVisible(false);
        }
    }, []);

    const handleCreate = useCallback((e: any) => {
        e.preventDefault();
        if(props.onAdd) {
            setIsVisible(false);
            props.onAdd(suggestion)
        }
    }, [suggestion]);

    const handleNop = useCallback((e: any) => {
        e.preventDefault();
    }, [])

    useEffect(() => {
        setSuggestion(String(props.value));
    }, [props.value])

    return (
        <div className="field">
            {props.label && 
                <label className="label">
                    {props.label}
                </label>
            }
            <div className="dropdown is-flex">
                <div 
                    className={`control dropdown-trigger is-flex-grow-1 ${props.leftIcon? 'has-icons-left': ''} has-icons-right`}
                >
                    <input 
                        className="input"
                        id={props.id}
                        name={props.name}
                        placeholder={props.placeholder}
                        title={props.title}
                        value={suggestion} 
                        required={props.required}
                        disabled={props.disabled}
                        autoComplete="off"
                        onChange={handleChangeSuggestion}
                        onBlur={handleHideMenu}
                        onFocus={handleShowMenu}
                    />
                    {props.leftIcon && 
                        <span className="icon is-left">
                            <i className={`la la-${props.leftIcon}`}></i>
                        </span>
                    }
                    {isLoading &&
                        <span className="icon is-right">
                            <i className="la la-spinner"></i>
                        </span>                        
                    }
                </div>
                <div
                    className={`dropdown-menu ${isVisible? 'is-block': ''}`}
                >
                    {suggestions.length > 0?
                        suggestions.map((opt, index) => 
                            <a 
                                key={index} 
                                className="dropdown-item"
                                href="#"
                                data-value={opt.value}
                                onClick={handleSelectSuggestion}
                            >
                                {opt.name}
                            </a>
                        )
                    :
                        props.onAdd?
                            <Button     
                                className="dropdown-item"
                                onClick={handleCreate}>
                                <i className="la la-plus-circle" />&nbsp;Add
                            </Button>
                        :
                        <a 
                            className="dropdown-item" 
                            href="#" 
                            onClick={handleNop}
                        >
                            <i>Nothing found</i>
                        </a>
                    }
                </div>
            </div>
        </div>
    );
};


export default AutocompleteField;