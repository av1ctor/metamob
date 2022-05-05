import React, {useState, ChangeEvent, useContext, useCallback, useEffect} from "react";
import {useUpdatePetition} from "../../../hooks/petitions";
import {Category, Tag, PetitionRequest, Petition} from "../../../../../declarations/dchanges/dchanges.did";
import TextField from "../../../components/TextField";
import SelectField from "../../../components/SelectField";
import Grid from "../../../components/Grid";
import Button from "../../../components/Button";
import NumberField from "../../../components/NumberField";
import MarkdownField from "../../../components/MarkdownField";

interface Props {
    petition: Petition;
    categories: Category[];
    tags: Tag[];
    onCancel: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
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
                target: form.target,
                body: form.body,
                cover: form.cover,
                duration: Number(form.duration),
                tags: form.tags
            }});
            props.onSuccess('Petition updated!');
            props.onCancel();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form]);

    return (
        <form>
            <Grid container>
                <TextField 
                    label="Title" 
                    name="title"
                    value={form.title || ''}
                    required={true}
                    onChange={changeForm}
                />
                <TextField 
                    label="Target" 
                    name="target"
                    value={form.target || ''}
                    required={true}
                    onChange={changeForm}
                />
                <MarkdownField
                    label="Body"
                    name="body"
                    value={form.body || ''}
                    rows={6}
                    onChange={changeForm}
                />
                <TextField 
                    label="Cover image" 
                    name="cover"
                    value={form.cover || ''}
                    required={true}
                    onChange={changeForm}
                />
                <NumberField 
                    label="Duration (in days)" 
                    name="duration"
                    value={form.duration}
                    required={true}
                    onChange={changeForm}
                />
                <SelectField
                    label="Category"
                    name="categoryId"
                    value={form.categoryId || ''}
                    options={props.categories.map((category) => ({name: category.name, value: category._id}))}
                    required={true}
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
                            color="danger"
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
        </form>
    );
};

export default EditForm;