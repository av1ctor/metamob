import React, {useCallback, useState} from "react";
import Button from "../../components/Button";
import SelectField from "../../components/SelectField";
import TextField from "../../components/TextField";
import {Filter} from "../../libs/common";
import { kinds } from "../../libs/places";

interface Props {
    filters: Filter[];
    onSearch: (filters: Filter[]) => unknown
};

const SearchForm = (props: Props) => {
    const [form, setForm] = useState(props.filters);

    const changeNameFilter = useCallback((e: any) => {
        const value = e.target.value;
        setForm(form => 
            form.map(f => f.key !== 'name'? f: {...f, value: value})
        );
    }, []);

    const changeKindFilter = useCallback((e: any) => {
        const value = e.target.value;
        setForm(form => 
            form.map(f => f.key !== 'kind'? f: {...f, value: value? Number(value): null})
        );
    }, []);

    const handleSubmit = useCallback((e: any) => {
        e.preventDefault();
        props.onSearch(form);
    }, [form]);

    return (
        <form onSubmit={handleSubmit}>
            <div className="is-flex-desktop">
                <TextField
                    name="name"
                    placeholder="Name"
                    title="Name filter"
                    leftIcon="signature"
                    value={form[0].value || ''}
                    onChange={changeNameFilter} 
                />
                <div className="ml-1"></div>
                <SelectField 
                    name="kind"
                    placeholder="All"
                    title="Kind filter"
                    leftIcon="list"
                    value={form[1].value || ''}
                    options={kinds}
                    onChange={changeKindFilter} 
                />
                <div className="ml-1"></div>
                <div className="field">
                    <div className="control">
                        <Button 
                            title="Filter"
                            onClick={handleSubmit}
                        >
                            <i className="la la-search" />
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default SearchForm;