import React, {useState, ChangeEvent, useCallback} from "react";
import {useCreateComment} from "../../../hooks/comments";
import {CommentRequest, Petition} from "../../../../../declarations/dchanges/dchanges.did";
import Grid from "../../../components/Grid";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";

interface Props {
    petition: Petition;
    body?: string;
    onCancel: () => void;
};

const CreateForm = (props: Props) => {
    const [form, setForm] = useState<CommentRequest>({
        petitionId: props.petition._id,
        body: props.body? `> ${props.body}\n\n` : '',
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
                            onClick={handleCreate}
                            disabled={createMut.isLoading}
                        >
                            Create
                        </Button>
                    </div>
                </div>
            </Grid>
        </>
    );
};

export default CreateForm;