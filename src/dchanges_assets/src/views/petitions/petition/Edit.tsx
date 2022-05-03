import React, {useState, ChangeEvent, useContext, useCallback} from "react";
import {useUpdatePetition} from "../../../hooks/petitions";
import {Category, Tag, PetitionRequest, Petition} from "../../../../../declarations/dchanges/dchanges.did";
import TextField from "../../../components/TextField";
import SelectField from "../../../components/SelectField";
import Grid from "../../../components/Grid";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";

interface Props {
    petition: Petition;
    categories: Category[];
    tags: Tag[];
    onCancel: () => void;
};

const EditForm = (props: Props) => {
    const [form, setForm] = useState<PetitionRequest>({
        ...props.petition
    });
    
    const updateMut = useUpdatePetition();

    const changeForm = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    const handleUpdate = useCallback(async () => {
        try {
            await updateMut.mutateAsync({pubId: props.petition.pubId, req: {
                categoryId: Number(form.categoryId),
                title: form.title,
                body: form.body,
                tags: form.tags
            }});
            props.onCancel();
        }
        catch(e) {
            alert(e);
        }
    }, [form]);

    return (
        <>
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
                        value={form.body || ''}
                        rows={6}
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
                    <Button
                        onClick={props.onCancel}
                    >
                        Cancel
                    </Button>
                </Grid>
                <Grid>
                    <Button
                        onClick={handleUpdate}
                        disabled={updateMut.isLoading}
                    >
                        Update
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

export default EditForm;