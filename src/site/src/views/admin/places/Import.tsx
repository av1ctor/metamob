import React, {useCallback, useState} from "react";
import * as yup from 'yup';
import Button from '../../../components/Button';
import {Place} from "../../../../../declarations/metamob/metamob.did";
import { useCreatePlace } from "../../../hooks/places";
import { useUI } from "../../../hooks/ui";
import TextAreaField from "../../../components/TextAreaField";
import { transformAuth } from "../../places/place/utils";

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
    const {showSuccess, showError, toggleLoading, isLoading} = useUI();
    
    const [form, setForm] = useState<Form>({
        json: '',
    });

    const mutation = useCreatePlace();
    
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
            toggleLoading(true);

            const items = JSON.parse(form.json) as Array<Place>;
            for(const item of items) {
                await mutation.mutateAsync({
                    req: {
                        name: item.name,
                        description: item.description,
                        icon: item.icon,
                        banner: item.banner[0]?
                            item.banner:
                            [],
                        terms: item.terms[0]?
                            item.terms:
                            [],
                        kind: Number(item.kind),
                        auth: transformAuth(item.auth),
                        parentId: item.parentId,
                        active: item.active,
                        lat: Number(item.lat),
                        lng: Number(item.lng),
                    }
                });
            }
            
            showSuccess('Places imported!');
            props.onClose();
        }
        catch(e: any) {
            showError(e);
        }
        finally {
            toggleLoading(false);
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
                            disabled={isLoading}
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