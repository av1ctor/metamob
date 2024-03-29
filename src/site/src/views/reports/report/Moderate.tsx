import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { ReportResponse, ReportCloseRequest } from "../../../../../declarations/metamob/metamob.did";
import Button from "../../../components/Button";
import SelectField, { Option } from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useCloseReport } from "../../../hooks/reports";
import { useUI } from "../../../hooks/ui";
import { kinds, ReportResult } from "../../../libs/reports";
import Avatar from "../../users/Avatar";
import EntityPreview from "./EntityPreview";

interface Props {
    report: ReportResponse;
    onModerate: (report: ReportResponse) => void;
    onClose: () => void;

}

const formSchema = yup.object().shape({
    resolution: yup.string().required().min(10).max(2048),
    result: yup.number().required(),
});

const results: Option[] = [
    {name: 'Verifying', value: ReportResult.VERIFYING},
    {name: 'Moderated', value: ReportResult.MODERATED},
    {name: 'Duplicated', value: ReportResult.DUPLICATED},
    {name: 'Ignored', value: ReportResult.IGNORED},
];

const ModerateForm = (props: Props) => {
    const {showSuccess, showError, toggleLoading} = useUI();
    
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
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            await closeMut.mutateAsync({
                pubId: props.report.pubId, 
                req: {
                    resolution: form.resolution,
                    result: Number(form.result),
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
            <SelectField
                label="Kind"
                name="kind"
                value={report.kind}
                options={kinds}
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
                        id={report.createdBy.length > 0? report.createdBy[0]: undefined} 
                        size='lg'
                    />
                </div>
            </div>
            
            <EntityPreview 
                report={report} 
                onModerate={props.onModerate}
                
                
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
                        {Number(form.result) === ReportResult.VERIFYING? 'Update': 'Close'}
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

export default ModerateForm;