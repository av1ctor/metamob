import React, {useCallback, useState} from "react";
import Button from "../../components/Button";
import TextField from "../../components/TextField";
import {Filter} from "../../libs/common";

interface Props {
    filters: Filter[];
    indexedColumns: string[];
    onSearch: (filters: Filter[]) => unknown
};

const SearchForm = (props: Props) => {
    const [form, setForm] = useState(props.filters);

    const changeTitleFilter = useCallback((e: any) => {
        const value = e.target.value;
        setForm(filters => 
            filters.map(f => f.key !== 'title'? f: {...f, value: value})
        );
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
                            name="title"
                            placeholder="Title"
                            leftIcon="signature"
                            value={form[0].value || ''}
                            onChange={changeTitleFilter} 
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