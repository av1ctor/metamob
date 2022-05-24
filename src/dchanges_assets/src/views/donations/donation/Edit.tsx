import React, {useState, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import {useUpdateDonation} from "../../../hooks/donations";
import {DonationResponse, DonationRequest} from "../../../../../declarations/dchanges/dchanges.did";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import CheckboxField from "../../../components/CheckboxField";
import TextField from "../../../components/TextField";

interface Props {
    donation: DonationResponse;
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
    
    const [form, setForm] = useState<DonationRequest>({
        campaignId: props.donation.campaignId,
        body: props.donation.body,
        value: props.donation.value,
        anonymous: props.donation.anonymous,
    });
    
    const updateMut = useUpdateDonation();

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

    const validate = async (form: DonationRequest): Promise<string[]> => {
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
                pubId: props.donation.pubId, 
                req: {
                    campaignId: Number(props.donation.campaignId),
                    body: form.body,
                    value: BigInt(form.value),
                    anonymous: form.anonymous,
                }
        });
            props.onSuccess('Donation updated!');
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
            campaignId: props.donation.campaignId,
            body: props.donation.body,
            value: props.donation.value,
            anonymous: props.donation.anonymous,
        });
    }, [props.donation]);

    return (
        <form onSubmit={handleUpdate}>
            <Container>
                <TextField
                    label="Value (ICP)"
                    id="value"
                    value={form.value.toString()}
                    onChange={changeForm}
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