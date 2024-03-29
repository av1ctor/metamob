import React, { useCallback, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import * as yup from 'yup';
import { ReportRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import SelectField from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import { useCreateReport } from "../../../hooks/reports";
import { useUI } from "../../../hooks/ui";
import { EntityType } from "../../../libs/common";
import { kinds } from "../../../libs/reports";

interface Props {
    entityId: number;
    entityType: EntityType;
    entityPubId: string;
    onClose: () => void;
};

const formSchema = yup.object().shape({
    entityId: yup.number().required(),
    entityType: yup.number().required(),
    entityPubId: yup.string().required(),
    kind: yup.number().required().min(0),
    description: yup.string().min(10).max(4096),
});

const CreateForm = (props: Props) => {
    const intl = useIntl();

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState<ReportRequest>({
        entityId: props.entityId,
        entityType: props.entityType,
        entityPubId: props.entityPubId,
        kind: -1,
        description: '',
    });

    const mutation = useCreateReport();

    const validate = (form: ReportRequest): string[] => {
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

            await mutation.mutateAsync({
                req: {
                    entityId: form.entityId,
                    entityType: form.entityType,
                    entityPubId: form.entityPubId,
                    kind: Number(form.kind),
                    description: form.description,
                }
            });

            showSuccess(intl.formatMessage({defaultMessage: 'Thanks, your report was created. If it is accepted, you will receive 1 MMT as reward!'}));
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

    return (
        <form onSubmit={handleCreate}>
            <Container>
                <SelectField
                    label="Reason"
                    name="kind"
                    options={kinds}
                    value={form.kind}
                    required
                    onChange={changeForm}
                />
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
                            onClick={handleCreate}>
                            <FormattedMessage id="Create" defaultMessage="Create"/>
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

export default CreateForm;