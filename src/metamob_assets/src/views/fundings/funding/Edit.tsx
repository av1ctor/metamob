import React, {useState, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import {useUpdateFunding} from "../../../hooks/fundings";
import {FundingResponse, FundingRequest} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";
import { ActorContext } from "../../../stores/actor";
import CheckboxField from "../../../components/CheckboxField";
import TextField from "../../../components/TextField";

interface Props {
    funding: FundingResponse;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    value: yup.number().required(),
    anonymous: yup.bool().required(),
});

const EditForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<FundingRequest>({
        campaignId: props.funding.campaignId,
        body: props.funding.body,
        tier: props.funding.tier,
        amount: props.funding.amount,
        value: props.funding.value,
        anonymous: props.funding.anonymous,
    });
    
    const updateMut = useUpdateFunding();

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

    const validate = (form: FundingRequest): string[] => {
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

            await updateMut.mutateAsync({
                main: actorState.main,
                pubId: props.funding.pubId, 
                req: {
                    campaignId: Number(props.funding.campaignId),
                    body: form.body,
                    tier: form.tier,
                    amount: form.amount,
                    value: BigInt(form.value),
                    anonymous: form.anonymous,
                }
        });
            props.onSuccess('Funding updated!');
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
            campaignId: props.funding.campaignId,
            body: props.funding.body,
            tier: props.funding.tier,
            amount: props.funding.amount,
            value: props.funding.value,
            anonymous: props.funding.anonymous,
        });
    }, [props.funding]);

    return (
        <form onSubmit={handleUpdate}>
            <Container>
                <TextField
                    label="Value (ICP)"
                    value={form.value.toString()}
                    disabled={true}
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