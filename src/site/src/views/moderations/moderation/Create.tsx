import React, { useCallback, useState } from "react";
import * as yup from 'yup';
import { ModerationRequest } from "../../../../../declarations/metamob/metamob.did";
import SelectField from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import { actions, ModerationReason, reasons } from "../../../libs/moderations";
import { setField } from "../../../libs/utils";

interface Props {
    form: ModerationRequest;
    onChange: (e: any) => void;
};

const formSchema = yup.object().shape({
    reportId: yup.number().required(),
    reason: yup.number().required().min(1),
    action: yup.number().required().min(1),
    body: yup.string().min(10).max(4096),
});

export const validateModerationForm = (
    form: ModerationRequest
): string[] => {
    try {
        formSchema.validateSync(form, {abortEarly: false});
        return [];
    }
    catch(e: any) {
        return e.errors;
    }
};

export const useModerationForm = (
    reportId?: number | null
) => {
    return useState<ModerationRequest>({
        reportId: reportId || 0,
        reason: ModerationReason.NONE,
        action: 0,
        body: '',
    });
}

export const useSetModerationFormField = (
    setModForm: (value: React.SetStateAction<ModerationRequest>) => void
) => {
    return useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setModForm(form => setField(form, field, value));
    }, []);
};

export const transformModerationForm = (
    form: ModerationRequest
): ModerationRequest => {
    return {
        reportId: Number(form.reportId),
        action: Number(form.action),
        reason: Number(form.reason),
        body: form.body,
    }
};

const CreateModerationForm = (props: Props) => {

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

export default CreateModerationForm;