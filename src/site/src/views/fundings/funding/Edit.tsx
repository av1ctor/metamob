import React, {useState, useCallback, useEffect} from "react";
import * as yup from 'yup';
import {useModerateFunding, useUpdateFunding} from "../../../hooks/fundings";
import {FundingResponse, FundingRequest} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import TextField from "../../../components/TextField";
import CreateModerationForm, { transformModerationForm, useModerationForm, useSetModerationFormField, validateModerationForm } from "../../moderations/moderation/Create";
import { isModerator } from "../../../libs/users";
import { FormattedMessage, useIntl } from "react-intl";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";

interface Props {
    funding: FundingResponse;
    reportId?: number | null;
    onClose: () => void;

};

const formSchema = yup.object().shape({
    body: yup.string(),
    value: yup.number().required(),
    anonymous: yup.bool().required(),
});

const EditForm = (props: Props) => {
    const {user} = useAuth();
    const intl = useIntl();

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState<FundingRequest>({
        campaignId: props.funding.campaignId,
        body: props.funding.body,
        tier: props.funding.tier,
        amount: props.funding.amount,
        value: props.funding.value,
        anonymous: props.funding.anonymous,
    });

    const [modForm, setModForm] = useModerationForm(props.reportId);
        
    const updateMut = useUpdateFunding();
    const moderateMut = useModerateFunding();

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

    const changeModForm = useSetModerationFormField(setModForm);

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
            showError(errors);
            return;
        }

        const isModeration = props.reportId && isModerator(user);

        if(isModeration) {
            const errors = validateModerationForm(modForm);
            if(errors.length > 0) {
                showError(errors);
                return;
            }
        }

        const transformReq = (): FundingRequest => {
            return {
                campaignId: Number(props.funding.campaignId),
                body: form.body,
                tier: form.tier,
                amount: form.amount,
                value: BigInt(form.value),
                anonymous: form.anonymous,
            };
        };
        
        try {
            toggleLoading(true);

            if(isModeration) {
                await moderateMut.mutateAsync({
                    pubId: props.funding.pubId, 
                    req: transformReq(),
                    mod: transformModerationForm(modForm)
                });
                showSuccess(intl.formatMessage({defaultMessage: 'Funding moderated!'}));
            }
            else {
                await updateMut.mutateAsync({
                    pubId: props.funding.pubId, 
                    req: transformReq(),
                });
                showSuccess(intl.formatMessage({defaultMessage: 'Funding updated!'}));
            }
            
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, modForm, props.onClose]);

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
                {props.reportId && isModerator(user) &&
                    <CreateModerationForm
                        form={modForm}
                        onChange={changeModForm}
                    />
                }
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleUpdate}
                            disabled={updateMut.isLoading}
                        >
                            <FormattedMessage id="Update" defaultMessage="Update"/>
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}
                        >
                            <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                        </Button>
                    </div>
                </div>
            </Container>
        </form>
    );
};

export default EditForm;