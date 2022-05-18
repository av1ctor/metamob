import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { Profile, Category, CategoryRequest } from "../../../../../declarations/dchanges/dchanges.did";
import Button from "../../../components/Button";
import ColorField from "../../../components/ColorField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useUpdateCategory } from "../../../hooks/categories";
import { ActorContext } from "../../../stores/actor";
import Avatar from "../../users/Avatar";

interface Props {
    category: Category;
    onEditUser: (user: Profile) => void;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().required().min(3).max(24),
    description: yup.string().required().min(3).max(256),
    color: yup.string().required(),
});

const EditForm = (props: Props) => {
    const [actorContext, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<CategoryRequest>({
        name: props.category.name,
        description: props.category.description,
        color: props.category.color,
    });

    const updateMut = useUpdateCategory(['categories']);

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

    const handleUpdate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = await validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }

        try {
            props.toggleLoading(true);

            await updateMut.mutateAsync({
                main: actorContext.main,
                pubId: props.category.pubId,
                req: {
                    name: form.name,
                    description: form.description,
                    color: form.color,
                }
            });
            props.onSuccess('Category updated!');
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
            name: props.category.name,
            description: props.category.description,
            color: props.category.color,
        });
    }, [props.category]);

    const {category} = props;
    
    return (
        <form onSubmit={handleUpdate}>
            <TextField
                label="Id"
                name="id"
                value={category.pubId}
                disabled
            />
            <TextField
                label="Name"
                name="name"
                value={form.name}
                required={true}
                onChange={changeForm}
            />
            <TextAreaField
                label="Description"
                name="description"
                rows={5}
                value={form.description}
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
            <div className="field">
                <label className="label">
                    Author
                </label>
                <div className="control">
                    <Avatar 
                        id={category.createdBy} 
                        size='lg'
                        onClick={props.onEditUser}
                    />
                </div>
            </div>
            
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button
                        onClick={handleUpdate}
                        disabled={updateMut.isLoading}
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