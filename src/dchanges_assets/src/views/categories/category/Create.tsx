import React, {useCallback, useContext, useState} from "react";
import * as yup from 'yup';
import Button from '../../../components/Button';
import TextField from "../../../components/TextField";
import ColorField from "../../../components/ColorField";
import {CategoryRequest} from "../../../../../declarations/dchanges/dchanges.did";
import { ActorContext } from "../../../stores/actor";
import { useCreateCategory } from "../../../hooks/categories";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    onClose: () => void;
};

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(32),
    color: yup.string().required(),
    description: yup.string().min(3).max(128),
});

const Create = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<CategoryRequest>({
        name: '',
        color: '',
        description: '',
    });

    const mutation = useCreateCategory();
    
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

        try {
            await mutation.mutateAsync({
                main: actorState.main,
                req: {
                    name: form.name,
                    description: form.description,
                    color: form.color,
                }
            });
            
            props.onSuccess('Category created!');
            props.onClose();
        }
        catch(e: any) {
            props.onError(e);
        }
    }, [actorState.main, form]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    return (
        <form onSubmit={handleCreate}>
            <div>
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

export default Create;