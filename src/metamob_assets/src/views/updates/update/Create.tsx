import React, {useState, ChangeEvent, useContext, useCallback} from "react";
import * as yup from 'yup';
import {useCreateUpdate} from "../../../hooks/updates";
import {UpdateRequest, Campaign} from "../../../../../declarations/metamob/metamob.did";
import { AuthContext } from "../../../stores/auth";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import MarkdownField from "../../../components/MarkdownField";
import { CampaignResult } from "../../../libs/campaigns";
import Container from "../../../components/Container";
import CheckboxField from "../../../components/CheckboxField";
import SwitchField from "../../../components/SwitchField";

interface Props {
    campaign: Campaign;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    body: yup.string().min(3).max(256),
});

const Create = (props: Props) => {
    const [auth, ] = useContext(AuthContext);
    const [actors, ] = useContext(ActorContext);
    const [result, setResult] = useState(CampaignResult.NONE);

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

    const validate = (form: UpdateRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }

        try {
            props.toggleLoading(true);

            await createMut.mutateAsync({
                main: actors.main,
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
        finally {
            props.toggleLoading(false);
        }
    }, [form, result, props.onClose]);

    const toggleResult = useCallback(() => {
        setResult(result => 
            result === CampaignResult.NONE? 
                CampaignResult.OK 
            : 
                CampaignResult.NONE
        );
    }, []);
    
    const changeResultToEnded = useCallback(() => {
        setResult(CampaignResult.NOK);
    }, []);

    const changeResultToFinished = useCallback(() => {
        setResult(CampaignResult.OK);
    }, []);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    if(!auth.user) {
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

                <SwitchField
                    label="Close the campaign"
                    id="close"
                    value={result !== CampaignResult.NONE? true: false}
                    onChange={toggleResult}
                />

                <CheckboxField
                    label="Goal accomplished! 🤗"
                    id="finished"
                    value={result === CampaignResult.OK? true: false}
                    disabled={result === CampaignResult.NONE}
                    onChange={changeResultToFinished}
                />

                <CheckboxField
                    label="Goal failed 😢"
                    id="ended"
                    color="danger"
                    value={result === CampaignResult.NOK? true: false}
                    disabled={result === CampaignResult.NONE}
                    onChange={changeResultToEnded}
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