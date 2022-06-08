import React, {useCallback, useState} from "react";
import { Category } from "../../../../declarations/metamob/metamob.did";
import AutocompleteField from "../../components/AutocompleteField";
import Button from "../../components/Button";
import SelectField, {Option} from "../../components/SelectField";
import TextField from "../../components/TextField";
import {Filter} from "../../libs/common";
import { search } from "../../libs/places";

interface Props {
    filters: Filter[];
    categories: Category[];
    indexedColumns: string[];
    onSearch: (filters: Filter[]) => unknown
    onError: (message: any) => void;
};

const SearchForm = (props: Props) => {
    const [form, setForm] = useState(props.filters);
    const [placeName, setPlaceName] = useState('');

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

    const changePlaceFilter = useCallback((e: any) => {
        const value = e.target.value;
        setForm(form => 
            form.map(f => f.key !== 'placeId'? f: {...f, value: value? Number(value): null})
        );
        setPlaceName(e.target.text);
    }, []);

    const handleSearchPlace = useCallback(async (
        value: string
    ): Promise<Option[]> => {
        try {
            return search(value);
        }
        catch(e) {
            props.onError(e);
            return [];
        }
    }, []);

    const handleSubmit = useCallback((e: any) => {
        e.preventDefault();
        props.onSearch(form);
    }, [form]);

    return (
        <form onSubmit={handleSubmit}>
            <div className="is-flex-desktop">
                <TextField
                    name="title"
                    placeholder="Title"
                    title="Title filter"
                    leftIcon="signature"
                    value={form[0].value || ''}
                    onChange={changeTitleFilter} 
                />
                <div className="ml-1"></div>
                <SelectField 
                    name="categoryId"
                    placeholder="All"
                    title="Category filter"
                    leftIcon="list"
                    value={form[1].value || ''}
                    options={props.categories.map((cat) => ({name: cat.name, value: cat._id}))}
                    onChange={changeCategoryFilter} 
                />
                {props.filters.length >= 3 && 
                    <>
                        <div className="ml-1"></div>
                        <AutocompleteField 
                            name="placeId"
                            placeholder="Any"
                            title="Place filter"
                            leftIcon="globe"
                            value={placeName}
                            onSearch={handleSearchPlace}
                            onChange={changePlaceFilter} 
                        />
                    </>
                }
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