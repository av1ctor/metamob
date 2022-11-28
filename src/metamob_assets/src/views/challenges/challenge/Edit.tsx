import React, { useCallback, useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import * as yup from 'yup';
import { Challenge, ChallengeRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import { useUpdateChallenge } from "../../../hooks/challenges";
import { useUI } from "../../../hooks/ui";

interface Props {
    challenge: Challenge;
    onClose: () => void;
};

const formSchema = yup.object().shape({
    moderationId: yup.number().required(),
    description: yup.string().min(10).max(4096),
});

const EditForm = (props: Props) => {
    const {showSuccess, showError, toggleLoading} = useUI();

    const {challenge} = props;
    
    const [form, setForm] = useState<ChallengeRequest>({
        moderationId: challenge.moderationId,
        description: challenge.description,
    });

    const mutation = useUpdateChallenge();

    const validate = (form: ChallengeRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleUpdate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }
        
        try {
            toggleLoading(true);

            await mutation.mutateAsync({
                pubId: props.challenge.pubId,
                req: {
                    moderationId: form.moderationId,
                    description: form.description,
                }
            });

            showSuccess('Challenge updated!');
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    useEffect(() => {
        const {challenge} = props;
        setForm({
            moderationId: challenge.moderationId,
            description: challenge.description,
        });
    }, [props.challenge]);

    return (
        <form onSubmit={handleUpdate}>
            <Container>
                <TextAreaField
                    label="Description"
                    name="description"
                    value={form.description || ''}
                    rows={6}
                    required={true}
                    onChange={changeForm} 
                />
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleUpdate}>
                            <FormattedMessage id="Update" defaultMessage="Update"/>
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}>
                            <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                        </Button>
                    </div>
                </div>
            </Container>
        </form>    
    )
};

export default EditForm;