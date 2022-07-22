import React, { useCallback, useContext, useState } from "react";
import * as yup from 'yup';
import { ReportRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import SelectField from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import { useCreateReport } from "../../../hooks/reports";
import { EntityType } from "../../../libs/common";
import { kinds, ReportKind } from "../../../libs/reports";
import { ActorContext } from "../../../stores/actor";

interface Props {
    entityId: number;
    entityType: EntityType;
    entityPubId: string;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    entityId: yup.number().required(),
    entityType: yup.number().required(),
    entityPubId: yup.string().required(),
    kind: yup.number().required(),
    description: yup.string().min(10).max(4096),
});

const CreateForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<ReportRequest>({
        entityId: props.entityId,
        entityType: props.entityType,
        entityPubId: props.entityPubId,
        kind: ReportKind.FAKE,
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
            props.onError(errors);
            return;
        }
        
        try {
            props.toggleLoading(true);

            await mutation.mutateAsync({
                main: actorState.main,
                req: {
                    entityId: form.entityId,
                    entityType: form.entityType,
                    entityPubId: form.entityPubId,
                    kind: Number(form.kind),
                    description: form.description,
                }
            });

            props.onSuccess('Thanks, your report was created. If it is accepted, you will receive 1 MMT as reward!');
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
                            Create
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

export default CreateForm;