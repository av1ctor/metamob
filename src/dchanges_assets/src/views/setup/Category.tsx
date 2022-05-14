import React, {useCallback, useState} from "react";
import * as yup from 'yup';
import Button from '../../components/Button';
import TextField from "../../components/TextField";
import Container from "../../components/Container";
import Panel from "../../components/Panel";
import ColorField from "../../components/ColorField";
import {CategoryRequest} from "../../../../declarations/dchanges/dchanges.did";

interface Props {
    onCreate: (req: CategoryRequest) => void,
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(32),
    color: yup.string().required(),
    description: yup.string().min(3).max(128),
});

const CategorySetupForm = (props: Props) => {
    const [form, setForm] = useState<CategoryRequest>({
        name: '',
        color: '',
        description: '',
    });
    
    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const validate = async (form: CategoryRequest): Promise<string[]> => {
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

        props.onCreate({
            name: form.name, 
            color: form.color,
            description: form.description,
        });
    }, [props.onCreate, form]);

    return (
        <form onSubmit={handleCreate}>
            <Panel label="Category registration">
                <Container>
                    <TextField 
                        label="Name"
                        name="name"
                        value={form.name || ''}
                        required={true}
                        onChange={changeForm} 
                    />
                    <TextField 
                        label="Description"
                        name="description"
                        value={form.description || ''}
                        required={true}
                        onChange={changeForm} 
                    />
                    <ColorField
                        label="Color"
                        name="color"
                        value={form.color || '#8abdf5'}
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
                    </div>
                </Container>
            </Panel>

        </form>
    );
};

export default CategorySetupForm;