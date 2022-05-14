import React, { useCallback, useContext, useState } from "react";
import * as yup from 'yup';
import { ReportRequest } from "../../../../../declarations/dchanges/dchanges.did";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextAreaField from "../../../components/TextAreaField";
import { useCreateReport } from "../../../hooks/reports";
import { ReportType } from "../../../libs/reports";
import { ActorContext } from "../../../stores/actor";

interface Props {
    entityId: number;
    entityType: ReportType;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    entityId: yup.number().required(),
    entityType: yup.number().required(),
    description: yup.string().min(10).max(4096),
});

const Report = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<ReportRequest>({
        entityId: props.entityId,
        entityType: props.entityType,
        description: '',
    });

    const mutation = useCreateReport();

    const validate = async (form: ReportRequest): Promise<string[]> => {
        try {
            await formSchema.validate(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = await validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }
        
        try {
            await mutation.mutateAsync({
                main: actorState.main,
                req: {
                    entityId: form.entityId,
                    entityType: form.entityType,
                    description: form.description,
                }
            });

            props.onSuccess('Report created!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form, actorState.main]);
    
    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    return (
        <form onSubmit={handleCreate}>
            <Container>
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
                            onClick={props.onClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Container>
        </form>    
    )
};

export default Report;