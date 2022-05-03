import React, {useState, ChangeEvent, useCallback} from "react";
import {useCreateComment} from "../../../hooks/comments";
import {CommentRequest, Petition} from "../../../../../declarations/dchanges/dchanges.did";
import Grid from "../../../components/Grid";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";

interface Props {
    petition: Petition;
    onCancel: () => void;
};

const CreateForm = (props: Props) => {
    const [form, setForm] = useState<CommentRequest>({
        petitionId: props.petition._id,
        body: '',
    });
    
    const createMut = useCreateComment();

    const changeForm = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({
            ...form, 
            [e.target.name]: e.target.value
        })
    };

    const handleCreate = useCallback(async () => {
        try {
            await createMut.mutateAsync({
                petitionId: props.petition._id,
                body: form.body,
            });
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
                    <Button
                        onClick={props.onCancel}
                    >
                        Cancel
                    </Button>
                </Grid>
                <Grid>
                    <Button
                        onClick={handleCreate}
                        disabled={createMut.isLoading}
                    >
                        Create
                    </Button>
                </Grid>
            </Grid>
        </>
    );
};

export default CreateForm;