import React, {useState, useCallback} from "react";
import Button from '../../components/Button';
import TextField from "../../components/TextField";
import SelectField from "../../components/SelectField";
import Grid from "../../components/Grid";
import TextAreaField from "../../components/TextAreaField";
import {Category, Tag, PetitionRequest} from "../../../../declarations/dchanges/dchanges.did";

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
        categoryId: 0,
        tags: []
    });

    const createPetition = useCallback(async () => {
        props.mutation.mutate({
            title: form.title,
            body: form.body,
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
        <div>
            <Grid container>
                <Grid>
                    <TextField 
                        label="Title"
                        name="title"
                        value={form.title || ''}
                        onChange={changeForm} 
                    />
                </Grid>
            </Grid>
            <Grid container>
                <Grid>
                    <TextAreaField
                            label="Body"
                            name="body"
                            rows={6}
                            value={form.body || ''}
                            onChange={changeForm} 
                        />
                </Grid>
            </Grid>
            <Grid container>
                <Grid>
                    <SelectField 
                        label="Category"
                        name="categoryId"
                        value={form.categoryId || ''}
                        options={props.categories.map((category) => ({name: category.name, value: category._id}))}
                        onChange={changeForm} 
                    />
                </Grid>
            </Grid>
            <Grid container>
                <Grid>
                    <TextField 
                        label="Tags"
                        name="tags"
                        value={form.tags.join(',')}
                        onChange={changeTags} 
                    />
                </Grid>
            </Grid>
            <Grid container>
                <Grid>
                    {props.mutation.isError && 
                        <div className="form-error">
                            {props.mutation.error.message}
                        </div>
                    }
                </Grid>
            </Grid>
            <Grid container>
                <Grid>
                    <Button 
                        onClick={props.onCancel} 
                    >
                        Cancel
                    </Button>
                </Grid>
                <Grid>
                    <Button 
                        onClick={createPetition} 
                        disabled={props.mutation.isLoading}
                    >
                        Create
                    </Button>
                </Grid>
            </Grid>
        </div>
    );
};

export default CreateForm;