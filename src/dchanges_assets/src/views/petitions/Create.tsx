import React, {useState, useCallback} from "react";
import Button from '../../components/Button';
import TextField from "../../components/TextField";
import SelectField from "../../components/SelectField";
import Grid from "../../components/Grid";
import TextAreaField from "../../components/TextAreaField";
import {Category, Tag, PetitionRequest} from "../../../../declarations/dchanges/dchanges.did";
import NumberField from "../../components/NumberField";

interface Props {
    mutation: any;
    categories: Category[];
    tags: Tag[];
    onCancel: () => void;
};

const CreateForm = (props: Props) => {
    const [form, setForm] = useState<PetitionRequest>({
        title: '',
        body: '',
        cover: '',
        duration: 7,
        categoryId: 0,
        tags: []
    });

    const createPetition = useCallback(async () => {
        props.mutation.mutate({
            title: form.title,
            body: form.body,
            cover: form.cover,
            duration: Number(form.duration),
            categoryId: Number(form.categoryId),
            tags: form.tags
        });
        props.onCancel();
    }, [form]);
    
    const changeForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({
            ...form, 
            [e.target.name]: e.target.value
        })
    };
  
    const changeTags = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({
            ...form, 
            tags: e.target.value.split(',').map(t => Number(t))
        })
    };
    
    return (
        <Grid container>
            <TextField 
                label="Title"
                name="title"
                value={form.title || ''}
                onChange={changeForm} 
            />
            <TextAreaField
                    label="Body"
                    name="body"
                    rows={6}
                    value={form.body || ''}
                    onChange={changeForm} 
                />
            <TextField 
                label="Cover image" 
                name="cover"
                value={form.cover || ''}
                onChange={changeForm}
            />
            <NumberField
                label="Duration (in days)" 
                name="duration"
                value={form.duration}
                onChange={changeForm}
            />
            <SelectField 
                label="Category"
                name="categoryId"
                value={form.categoryId || ''}
                options={props.categories.map((category) => ({name: category.name, value: category._id}))}
                onChange={changeForm} 
            />
            <TextField 
                label="Tags"
                name="tags"
                value={form.tags.join(',')}
                onChange={changeTags} 
            />
            <Grid container>
                {props.mutation.isError && 
                    <div className="form-error">
                        {props.mutation.error.message}
                    </div>
                }
            </Grid>
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button 
                        onClick={props.onCancel} 
                    >
                        Cancel
                    </Button>
                </div>
                <div className="control">
                    <Button 
                        onClick={createPetition} 
                        disabled={props.mutation.isLoading}
                    >
                        Create
                    </Button>
                </div>
            </div>
        </Grid>
    );
};

export default CreateForm;