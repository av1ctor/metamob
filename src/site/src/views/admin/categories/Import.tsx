import React, {useCallback, useState} from "react";
import * as yup from 'yup';
import Button from '../../../components/Button';
import {Category} from "../../../../../declarations/metamob/metamob.did";
import { useCreateCategory } from "../../../hooks/categories";
import { useUI } from "../../../hooks/ui";
import TextAreaField from "../../../components/TextAreaField";

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

    const mutation = useCreateCategory();
    
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
            
            const items = JSON.parse(form.json) as Array<Category>;
            for(const item of items) {
                await mutation.mutateAsync({
                    req: {
                        name: item.name,
                        description: item.description,
                        color: item.color,
                    }
                });
            }
            
            showSuccess('Categories imported!');
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
                            onClick={handleImport}
                            disabled={isLoading}
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