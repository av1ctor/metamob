import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { Profile, Report, ReportCloseRequest } from "../../../../../declarations/dchanges/dchanges.did";
import Button from "../../../components/Button";
import SelectField, { Option } from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useCloseReport } from "../../../hooks/reports";
import { ReportResult } from "../../../libs/reports";
import { ActorContext } from "../../../stores/actor";
import Avatar from "../../users/Avatar";
import Entity from "./Entity";

interface Props {
    report: Report;
    onEditUser: (user: Profile) => void;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    resolution: yup.string().required().min(10).max(2048),
    result: yup.number().required(),
});

const results: Option[] = [
    {name: 'Verifying', value: ReportResult.VERIFYING},
    {name: 'Solved', value: ReportResult.SOLVED},
    {name: 'Duplicated', value: ReportResult.DUPLICATED},
];

const EditForm = (props: Props) => {
    const [actorContext, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<ReportCloseRequest>({
        resolution: props.report.resolution,
        result: props.report.result
    });

    const closeMut = useCloseReport();

    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const validate = (form: ReportCloseRequest): string[] => {
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

            await closeMut.mutateAsync({
                main: actorContext.main,
                pubId: props.report.pubId, 
                req: {
                    resolution: form.resolution,
                    result: Number(form.result),
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
    }, [form, actorContext.main, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    useEffect(() => {
        setForm({
            resolution: props.report.resolution,
            result: props.report.result
        });
    }, [props.report]);

    const {report} = props;
    
    return (
        <form onSubmit={handleUpdate}>
            <TextField
                label="Id"
                name="id"
                value={report.pubId}
                disabled
            />
            <TextAreaField
                label="Description"
                name="description"
                rows={5}
                value={report.description}
                disabled
            />
            <div className="field">
                <label className="label">
                    Reporter
                </label>
                <div className="control">
                    <Avatar 
                        id={report.createdBy} 
                        size='lg'
                        onClick={props.onEditUser}
                    />
                </div>
            </div>
            
            <Entity 
                report={report} 
                onEditUser={props.onEditUser}
                onSuccess={props.onSuccess}
                onError={props.onError}
            />
            
            <TextAreaField
                label="Resolution"
                name="resolution"
                rows={5}
                value={form.resolution}
                onChange={changeForm}
            />
            <SelectField
                label="Result"
                name="result"
                value={form.result}
                options={results}
                onChange={changeForm}
            />
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button
                        onClick={handleUpdate}
                        disabled={closeMut.isLoading}
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
        </form>
    );
};

export default EditForm;