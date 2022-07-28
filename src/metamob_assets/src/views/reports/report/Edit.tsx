import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { ReportResponse, ReportRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import SelectField from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import { useUpdateReport } from "../../../hooks/reports";
import { kinds } from "../../../libs/reports";
import { ActorContext } from "../../../stores/actor";

interface Props {
    report: ReportResponse;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    entityId: yup.number().required(),
    entityType: yup.number().required(),
    kind: yup.number().required(),
    description: yup.string().min(10).max(4096),
});

const EditForm = (props: Props) => {
    const [actors, ] = useContext(ActorContext);

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
            props.onError(errors);
            return;
        }
        
        try {
            props.toggleLoading(true);

            await mutation.mutateAsync({
                main: actors.main,
                pubId: props.report.pubId,
                req: {
                    entityId: form.entityId,
                    entityPubId: form.entityPubId,
                    entityType: form.entityType,
                    kind: Number(form.kind),
                    description: form.description,
                }
            });

            props.onSuccess('Report updated!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, actors.main, props.onClose]);

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