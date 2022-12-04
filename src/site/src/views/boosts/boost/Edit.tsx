import React, {useState, useCallback, useEffect} from "react";
import * as yup from 'yup';
import {useUpdateBoost} from "../../../hooks/boosts";
import {BoostResponse, BoostRequest} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import TextField from "../../../components/TextField";
import { FormattedMessage, useIntl } from "react-intl";
import { useUI } from "../../../hooks/ui";

interface Props {
    boost: BoostResponse;
    onClose: () => void;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    value: yup.number().required(),
    anonymous: yup.bool().required(),
});

const EditForm = (props: Props) => {
    const intl = useIntl();

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState<BoostRequest>({
        campaignId: props.boost.campaignId,
        currency: props.boost.currency,
        value: props.boost.value,
        anonymous: props.boost.anonymous,
    });

    const updateMut = useUpdateBoost();

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

    const validate = (form: BoostRequest): string[] => {
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

        const transformReq = (): BoostRequest => {
            return {
                campaignId: Number(props.boost.campaignId),
                currency: form.currency,
                value: BigInt(form.value),
                anonymous: form.anonymous,
            };
        };
        
        try {
            toggleLoading(true);

            await updateMut.mutateAsync({
                pubId: props.boost.pubId, 
                req: transformReq(),
            });
            showSuccess(intl.formatMessage({defaultMessage: 'Boost updated!'}));

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

    useEffect(() => {
        setForm({
            campaignId: props.boost.campaignId,
            currency: props.boost.currency,
            value: props.boost.value,
            anonymous: props.boost.anonymous,
        });
    }, [props.boost]);

    return (
        <form onSubmit={handleUpdate}>
            <Container>
                <TextField
                    label="Value (ICP)"
                    value={form.value.toString()}
                    disabled={true}
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