import React, {useCallback, useState} from "react";
import Button from "../../components/Button";
import SelectField from "../../components/SelectField";
import TextField from "../../components/TextField";
import {Filter} from "../../libs/common";

interface Props {
    filters: Filter;
    indexedColumns: string[];
    onSearch: (filters: Filter) => unknown
};

const SearchForm = (props: Props) => {
    const [form, setForm] = useState(props.filters);

    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const handleSubmit = useCallback((e: any) => {
        e.preventDefault();
        props.onSearch(form);
    }, [form]);

    return (
        <nav className="level">
            <form onSubmit={handleSubmit}>
                <div className="level-left">
                    <div className="level-item">
                        <TextField
                            name="value"
                            value={form.value || ''}
                            onChange={changeForm} 
                        />
                    </div>
                    <div className="level-item">
                        <div className="field">
                            <div className="control">
                                <Button onClick={handleSubmit}><i className="la la-search" /></Button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </nav>
    );
};

export default SearchForm;