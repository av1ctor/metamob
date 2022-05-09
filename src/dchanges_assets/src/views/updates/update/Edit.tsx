import React, {useState, ChangeEvent, useCallback, useContext} from "react";
import * as yup from 'yup';
import {useUpdateUpdate} from "../../../hooks/updates";
import {Update, UpdateRequest} from "../../../../../declarations/dchanges/dchanges.did";
import Grid from "../../../components/Grid";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";

interface Props {
    update: Update;
    onCancel: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    body: yup.string().min(3).max(256),
});

const EditForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<UpdateRequest>({
        campaignId: 0,
        body: props.update.body,
    });
    
    const updateMut = useUpdateUpdate();

    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const validate = async (form: UpdateRequest): Promise<string[]> => {
        try {
            await formSchema.validate(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleUpdate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = await validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }
        
        try {
            await updateMut.mutateAsync({
                main: actorState.main,
                pubId: props.update.pubId, 
                req: {
                    campaignId: Number(props.update.campaignId),
                    body: form.body,
                }
        });
            props.onSuccess('Update updated!');
            props.onCancel();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form]);

    return (
        <form onSubmit={handleUpdate}>
            <Grid container>
                <TextAreaField
                    label="Body"
                    name="body"
                    value={form.body || ''}
                    rows={6}
                    required={true}
                    onChange={changeForm}
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