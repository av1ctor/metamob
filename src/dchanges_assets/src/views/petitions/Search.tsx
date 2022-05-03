import React, {useCallback, useState} from "react";
import SelectField from "../../components/SelectField";
import TextField from "../../components/TextField";
import {Filter} from "../../interfaces/common";

interface Props {
    filters: Filter;
    indexedColumns: string[];
    onSearch: (filters: Filter) => unknown
};

const SearchForm = (props: Props) => {
    const [form, setForm] = useState(props.filters);

    const changeForm = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({
            ...form, 
            [e.target.name]: e.target.value
        })
    }, [form]);

    const handleSubmit = useCallback((e: any) => {
        e.preventDefault();
        props.onSearch(form);
    }, [form]);

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-auto">
                <SelectField
                    label="Column"
                    name="key"
                    value={form.key || ''}
                    options={props.indexedColumns.map((col) => ({name: col, value: col}))}
                    onChange={changeForm} 
                />
            </div>
            <div className="flex-auto">
                <SelectField
                    label="Operator"
                    name="op"
                    value={form.op}
                    options={[{name: "Equals", value: "eq"}, {name: "Contains", value: "contains"}]}
                    onChange={changeForm} 
                />
            </div>
            <div className="flex-auto">
                <TextField
                    label="Value"
                    name="value"
                    value={form.value || ''}
                    onChange={changeForm} 
                />
            </div>
        </form>
    );
};

export default SearchForm;