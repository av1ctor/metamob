import React, {useState, ChangeEvent, useCallback, useContext} from "react";
import * as yup from 'yup';
import {useUpdateSignature} from "../../../hooks/signatures";
import {SignatureResponse, SignatureRequest} from "../../../../../declarations/dchanges/dchanges.did";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import CheckboxField from "../../../components/CheckboxField";

interface Props {
    signature: SignatureResponse;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    body: yup.string().min(3).max(256),
    anonymous: yup.bool().required(),
});

const EditForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<SignatureRequest>({
        campaignId: 0,
        body: props.signature.body,
        anonymous: props.signature.anonymous,
    });
    
    const updateMut = useUpdateSignature();

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

    const validate = async (form: SignatureRequest): Promise<string[]> => {
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
                pubId: props.signature.pubId, 
                req: {
                    campaignId: Number(props.signature.campaignId),
                    body: form.body,
                    anonymous: form.anonymous,
                }
        });
            props.onSuccess('Signature updated!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    return (
        <form onSubmit={handleUpdate}>
            <Container>
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