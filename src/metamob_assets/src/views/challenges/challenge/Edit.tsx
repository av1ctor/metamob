import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { Challenge, ChallengeRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import { useUpdateChallenge } from "../../../hooks/challenges";
import { ActorContext } from "../../../stores/actor";

interface Props {
    challenge: Challenge;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    moderationId: yup.number().required(),
    description: yup.string().min(10).max(4096),
});

const EditForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);

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
            props.onError(errors);
            return;
        }
        
        try {
            props.toggleLoading(true);

            await mutation.mutateAsync({
                main: actorState.main,
                pubId: props.challenge.pubId,
                req: {
                    moderationId: form.moderationId,
                    description: form.description,
                }
            });

            props.onSuccess('Challenge updated!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, actorState.main, props.onClose]);

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
                            Update
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Container>
        </form>    
    )
};

export default EditForm;