import React, {useCallback, useState} from "react";
import * as yup from 'yup';
import Button from '../../../components/Button';
import {Campaign} from "../../../../../declarations/metamob/metamob.did";
import { useCreateCampaign } from "../../../hooks/campaigns";
import { useUI } from "../../../hooks/ui";
import TextAreaField from "../../../components/TextAreaField";
import { CampaignKind } from "../../../libs/campaigns";
import { decimalToIcp } from "../../../libs/icp";
import { transformInfo } from "../../campaigns/campaign/Create";

interface Props {
    onClose: () => void;
};

interface Form {
    json: string;
}

const formSchema = yup.object().shape({
    json: yup.string().required(),
});

const Import = (props: Props) => {
    const {showSuccess, showError} = useUI();
    
    const [form, setForm] = useState<Form>({
        json: '',
    });

    const mutation = useCreateCampaign();
    
    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const validate = (form: Form): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleImport = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            const items = JSON.parse(form.json) as Array<Campaign>;
            for(const form of items) {
                const kind = Number(form.kind);
                await mutation.mutateAsync({
                    req: {
                        kind: kind,
                        goal: kind === CampaignKind.DONATIONS || kind === CampaignKind.FUNDINGS?
                            typeof form.goal === 'string'? 
                                decimalToIcp(form.goal):
                                form.goal:
                            BigInt(form.goal),
                        state: [form.state],
                        title: form.title,
                        target: form.target,
                        body: form.body,
                        cover: form.cover,
                        duration: Number(form.duration),
                        categoryId: Number(form.categoryId),
                        placeId: Number(form.placeId),
                        tags: form.tags,
                        info: transformInfo(form.info),
                        action: 'invoke' in form.action?
                            !form.action.invoke.canisterId?
                                {nop: null}
                            :
                            form.action
                        :
                            form.action,
                    },
                    cover: undefined
                });
            }
            
            showSuccess('Campaigns imported!');
            props.onClose();
        }
        catch(e: any) {
            showError(e);
        }
    }, [form]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    return (
        <form onSubmit={handleImport}>
            <div>
                <TextAreaField
                    label="Json"
                    name="json"
                    value={form.json || ''}
                    rows={10}
                    required
                    onChange={changeForm} 
                />
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleImport}
                        >
                            Import
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
            </div>
        </form>
    );
};

export default Import;