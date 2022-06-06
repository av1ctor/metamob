import React, {useState, ChangeEvent, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import {useUpdateVote} from "../../../hooks/votes";
import {VoteResponse, VoteRequest} from "../../../../../declarations/dchanges/dchanges.did";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import CheckboxField from "../../../components/CheckboxField";

interface Props {
    vote: VoteResponse;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    pro: yup.bool().required(),
    anonymous: yup.bool().required(),
});

const EditForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<VoteRequest>({
        campaignId: props.vote.campaignId,
        body: props.vote.body,
        pro: props.vote.pro,
        anonymous: props.vote.anonymous,
    });
    
    const updateMut = useUpdateVote();

    const changeForm = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field.replace('__edit__', '')]: value
        }));
    }, []);

    const validate = async (form: VoteRequest): Promise<string[]> => {
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
            props.toggleLoading(true);

            await updateMut.mutateAsync({
                main: actorState.main,
                pubId: props.vote.pubId, 
                req: {
                    campaignId: Number(props.vote.campaignId),
                    body: form.body,
                    pro: Boolean(form.pro),
                    anonymous: form.anonymous,
                }
        });
            props.onSuccess('Vote updated!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    useEffect(() => {
        setForm({
            campaignId: props.vote.campaignId,
            body: props.vote.body,
            pro: props.vote.pro,
            anonymous: props.vote.anonymous,
        });
    }, [props.vote]);

    return (
        <form onSubmit={handleUpdate}>
            <Container>
                <CheckboxField
                    label="In favor"
                    value={!!form.pro}
                    disabled
                />
                <CheckboxField
                    label="Against"
                    value={!form.pro}
                    disabled
                />
                <TextAreaField
                    label="Message"
                    name="body"
                    value={form.body || ''}
                    rows={6}
                    required={true}
                    onChange={changeForm}
                />
                <CheckboxField
                    label="Sign as anonymous"
                    id="__edit__anonymous"
                    value={form.anonymous}
                    onChange={changeForm}
                />
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleUpdate}
                            disabled={updateMut.isLoading}
                        >
                            Update
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

export default EditForm;