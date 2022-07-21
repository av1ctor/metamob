import React, { useState } from "react";
import * as yup from 'yup';
import { ModerationRequest } from "../../../../../declarations/metamob/metamob.did";
import SelectField from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import { actions, ModerationAction, ModerationReason, reasons } from "../../../libs/moderations";

interface Props {
    form: ModerationRequest;
    onChange: (e: any) => void;
};

const formSchema = yup.object().shape({
    reportId: yup.number().required(),
    reason: yup.number().required(),
    action: yup.number().required(),
    body: yup.string().min(10).max(4096),
});

export const validateForm = (form: ModerationRequest): string[] => {
    try {
        formSchema.validateSync(form, {abortEarly: false});
        return [];
    }
    catch(e: any) {
        return e.errors;
    }
};

export const useForm = (reportId: number | string | null) => {
    return useState<ModerationRequest>({
        reportId: reportId !== null? Number(reportId): 0,
        reason: ModerationReason.NONE,
        action: ModerationAction.Flagged,
        body: '',
    });
}

export const transformForm = (form: ModerationRequest): ModerationRequest => {
    return {
        reportId: Number(form.reportId),
        action: Number(form.action),
        reason: Number(form.reason),
        body: form.body,
    }
};

const CreateForm = (props: Props) => {

    const {form, onChange} = props;

    return (
        <div className="field">
            <label className="label">
                Moderation
            </label>
            <div className="control preview-box">
                <SelectField
                    label="Reason"
                    name="reason"
                    options={reasons}
                    value={form.reason}
                    required
                    onChange={onChange}
                />
                <SelectField
                    label="Action"
                    name="action"
                    options={actions}
                    value={form.action}
                    required
                    onChange={onChange}
                />
                <TextAreaField
                    label="Description"
                    name="body"
                    value={form.body || ''}
                    rows={6}
                    required={true}
                    onChange={onChange} 
                />
            </div>
        </div>
    )
};

export default CreateForm;