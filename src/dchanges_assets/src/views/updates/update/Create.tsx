import React, {useState, ChangeEvent, useContext, useCallback} from "react";
import * as yup from 'yup';
import {useCreateUpdate} from "../../../hooks/updates";
import {UpdateRequest, Campaign} from "../../../../../declarations/dchanges/dchanges.did";
import { AuthContext } from "../../../stores/auth";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import MarkdownField from "../../../components/MarkdownField";
import { CampaignResult } from "../../../libs/campaigns";
import Container from "../../../components/Container";

interface Props {
    campaign: Campaign;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    body: yup.string().min(3).max(256),
});

const Create = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);

    const [form, setForm] = useState<UpdateRequest>({
        campaignId: props.campaign._id,
        body: '',
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

    const doCreate = useCallback(async (result?: CampaignResult) => {
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
                },
                result: result
            });

            setForm({
                ...form,
                body: ''
            });

            props.onSuccess('Campaign updated!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form, props.onClose]);

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();
        doCreate();
    }, [doCreate]);    

    const handleEnd = useCallback(async (e: any) => {
        e.preventDefault();
        doCreate(CampaignResult.LOST);
    }, [doCreate]);    

    const handleFinish = useCallback(async (e: any) => {
        e.preventDefault();
        doCreate(CampaignResult.WON);
    }, [doCreate]);    

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    if(!authState.user) {
        return null;
    }

    return (
        <form onSubmit={handleCreate}>
            <Container>
                <MarkdownField
                    label="Message"
                    name="body"
                    value={form.body || ''}
                    rows={6}
                    onChange={changeForm}
                />

                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            color="success"
                            disabled={createMut.isLoading || !form.body}
                            title="Post an update message"
                            onClick={handleCreate}
                        >
                            Create
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            title="Post a final message if the goal was not achieved and end the campaign"
                            disabled={createMut.isLoading || !form.body}
                            onClick={handleEnd}
                        >
                            <i className="la la-thumbs-down"/>&nbsp;End
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="warning"
                            title="Post a final message if the goal was achieved and finish the campaign"
                            disabled={createMut.isLoading || !form.body}
                            onClick={handleFinish}
                        >
                            <i className="la la-thumbs-up"/>&nbsp;Finish
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Container>
        </form>
    );
};

export default Create;