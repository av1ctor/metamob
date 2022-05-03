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
                value={form.body || ''}
                rows={6}
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
                        onClick={handleUpdate}
                        disabled={updateMut.isLoading}
                    >
                        Update
                    </Button>
                </div>
            </div>
        </Grid>
    );
};

export default EditForm;