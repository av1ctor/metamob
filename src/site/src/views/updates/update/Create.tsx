import React, {useState, useCallback} from "react";
import * as yup from 'yup';
import {useCreateUpdate} from "../../../hooks/updates";
import {UpdateRequest, Campaign} from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import MarkdownField from "../../../components/MarkdownField";
import { CampaignResult } from "../../../libs/campaigns";
import Container from "../../../components/Container";
import CheckboxField from "../../../components/CheckboxField";
import SwitchField from "../../../components/SwitchField";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";

interface Props {
    campaign: Campaign;
    onClose: () => void;
};

const formSchema = yup.object().shape({
    body: yup.string().min(3).max(256),
});

const Create = (props: Props) => {
    const {user} = useAuth();

    const {showSuccess, showError, toggleLoading} = useUI();

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
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            await createMut.mutateAsync({
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

            showSuccess('Campaign updated!');
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
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

    if(!user) {
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
                            <FormattedMessage id="Create" defaultMessage="Create"/>
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}
                        >
                            <FormattedMessage id="Cancel" defaultMessage="Cancel" />
                        </Button>
                    </div>
                </div>
            </Container>
        </form>
    );
};

export default Create;