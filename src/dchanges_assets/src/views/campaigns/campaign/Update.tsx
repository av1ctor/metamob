import React, {useState, ChangeEvent, useContext, useCallback} from "react";
import * as yup from 'yup';
import {useCreateUpdate} from "../../../hooks/updates";
import {UpdateRequest, Campaign} from "../../../../../declarations/dchanges/dchanges.did";
import { AuthContext } from "../../../stores/auth";
import Grid from "../../../components/Grid";
import Button from "../../../components/Button";
import TextAreaField from "../../../components/TextAreaField";
import { ActorContext } from "../../../stores/actor";

interface Props {
    campaign: Campaign;
    body?: string;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    body: yup.string().min(3).max(256),
});

const UpdateForm = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);

    const [form, setForm] = useState<UpdateRequest>({
        campaignId: props.campaign._id,
        body: props.body || '',
    });
    
    const createMut = useCreateUpdate();

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
            await createMut.mutateAsync({
                main: actorState.main,
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
                }
            });
            props.onSuccess('Campaign updated!');
        }
        catch(e) {
            props.onError(e);
        }
    }, [form]);

    if(!authState.user) {
        return null;
    }

    return (
        <form onSubmit={handleUpdate}>
            <Grid container>
                <TextAreaField
                    label="Message"
                    name="body"
                    value={form.body || ''}
                    rows={6}
                    required={true}
                    disabled={!!props.body}
                    onChange={changeForm}
                />

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleUpdate}
                            disabled={createMut.isLoading || !!props.body}
                        >
                            UPDATE
                        </Button>
                    </div>
                </div>
            </Grid>
        </form>
    );
};

export default UpdateForm;