import React, { useCallback, useEffect, useState } from "react";
import Button from "./Button";
import { Option } from "./SelectField";

interface Props {
    id?: string;
    name?: string;
    label?: string;
    value: string | number;
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
        setSuggestion(suggestion);
    }, [props.onSearch]);

    const handleSelectSuggestion = useCallback((e: any) => {
        const text = e.target.text;
        const value = e.target.dataset.value;
        setSuggestion(text);
        setSuggestions([]);
        setIsVisible(false);
        if(props.onChange) {
            props.onChange({target: {id: props.id, name: props.name, value: value}});
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
                    className={`control dropdown-trigger is-flex-grow-1 ${isLoading? 'has-icons-right': ''}`}
                >
                    <input 
                        className="input"
                        id={props.id}
                        name={props.name}
                        value={suggestion} 
                        required={props.required}
                        disabled={props.disabled}
                        autoComplete="off"
                        onChange={handleChangeSuggestion}
                        onBlur={handleHideMenu}
                        onFocus={handleShowMenu}
                    />
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
                        <a className="dropdown-item" href="#">
                            <i>Nothing found</i>
                        </a>
                    }
                </div>
            </div>
        </div>
    );
};


export default AutocompleteField;