import React, {useState, ChangeEvent, useCallback} from "react";
import {useUpdateComment} from "../../../hooks/comments";
import {Comment, CommentRequest} from "../../../../../declarations/dchanges/dchanges.did";
import Grid from "../../../components/Grid";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";

interface Props {
    comment: Comment;
    onCancel: () => void;
};

const EditForm = (props: Props) => {
    const [form, setForm] = useState<CommentRequest>({
        petitionId: 0,
        body: props.comment.body,
    });
    
    const updateMut = useUpdateComment();

    const changeForm = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({
            ...form, 
            [e.target.name]: e.target.value
        })
    };

    const handleUpdate = useCallback(async () => {
        try {
            await updateMut.mutateAsync({pubId: props.comment.pubId, req: {
                petitionId: Number(props.comment.petitionId),
                body: form.body,
            }});
            props.onCancel();
        }
        catch(e) {
            alert(e);
        }
    }, [form]);

    return (
        <Grid container>
            <TextAreaField
                label="Body"
                name="body"
                value={form.body || ''}
                rows={6}
                onChange={changeForm}
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