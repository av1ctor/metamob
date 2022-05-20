import React, {useCallback, useState} from "react";
import { Category } from "../../../../declarations/dchanges/dchanges.did";
import Button from "../../components/Button";
import SelectField from "../../components/SelectField";
import TextField from "../../components/TextField";
import {Filter} from "../../libs/common";

interface Props {
    filters: Filter[];
    categories: Category[];
    indexedColumns: string[];
    onSearch: (filters: Filter[]) => unknown
};

const SearchForm = (props: Props) => {
    const [form, setForm] = useState(props.filters);

    const changeTitleFilter = useCallback((e: any) => {
        const value = e.target.value;
        setForm(form => 
            form.map(f => f.key !== 'title'? f: {...f, value: value})
        );
    }, []);

    const changeCategoryFilter = useCallback((e: any) => {
        const value = e.target.value;
        setForm(form => 
            form.map(f => f.key !== 'categoryId'? f: {...f, value: value? Number(value): null})
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
                            title="Title filter"
                            leftIcon="signature"
                            value={form[0].value || ''}
                            onChange={changeTitleFilter} 
                        />
                    </div>
                    <div className="level-item">
                        <SelectField 
                            name="categoryId"
                            placeholder="All"
                            title="Category filter"
                            leftIcon="list"
                            value={form[1].value || ''}
                            options={props.categories.map((cat) => ({name: cat.name, value: cat._id}))}
                            onChange={changeCategoryFilter} 
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