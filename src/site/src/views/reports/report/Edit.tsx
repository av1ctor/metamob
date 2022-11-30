import React, { useCallback, useEffect, useState } from "react";
import * as yup from 'yup';
import { ReportResponse, ReportRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import SelectField from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import { useUpdateReport } from "../../../hooks/reports";
import { useUI } from "../../../hooks/ui";
import { kinds } from "../../../libs/reports";

interface Props {
    report: ReportResponse;
    onClose: () => void;
};

const formSchema = yup.object().shape({
    entityId: yup.number().required(),
    entityType: yup.number().required(),
    kind: yup.number().required(),
    description: yup.string().min(10).max(4096),
});

const EditForm = (props: Props) => {
    const {showSuccess, showError, toggleLoading} = useUI();

    const {report} = props;
    
    const [form, setForm] = useState<ReportRequest>({
        entityId: report.entityId,
        entityPubId: report.entityPubId,
        entityType: report.entityType,
        kind: report.kind,
        description: report.description,
    });

    const mutation = useUpdateReport();

    const validate = (form: ReportRequest): string[] => {
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
                pubId: props.report.pubId,
                req: {
                    entityId: form.entityId,
                    entityPubId: form.entityPubId,
                    entityType: form.entityType,
                    kind: Number(form.kind),
                    description: form.description,
                }
            });

            showSuccess('Report updated!');
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
        const {report} = props;
        setForm({
            entityId: report.entityId,
            entityType: report.entityType,
            entityPubId: report.pubId,
            kind: report.kind,
            description: report.description,
        });
    }, [props.report]);

    return (
        <form onSubmit={handleUpdate}>
            <Container>
                <SelectField
                    label="Kind"
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