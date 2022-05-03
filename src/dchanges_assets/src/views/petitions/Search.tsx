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
        <nav className="level">
            <form onSubmit={handleSubmit}>
                <div className="level-left">
                    <div className="level-item">
                        <SelectField
                            name="key"
                            value={form.key || ''}
                            options={props.indexedColumns.map((col) => ({name: col, value: col}))}
                            onChange={changeForm} 
                        />
                    </div>
                    <div className="level-item">
                        <SelectField
                            name="op"
                            value={form.op}
                            options={[{name: "Equals", value: "eq"}, {name: "Contains", value: "contains"}]}
                            onChange={changeForm} 
                        />
                    </div>
                    <div className="level-item">
                        <TextField
                            name="value"
                            value={form.value || ''}
                            onChange={changeForm} 
                        />
                    </div>
                </div>
            </form>
        </nav>
    );
};

export default SearchForm;