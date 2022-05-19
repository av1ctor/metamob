import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { Profile, Place, PlaceRequest } from "../../../../../declarations/dchanges/dchanges.did";
import AutocompleteField from "../../../components/AutocompleteField";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import SelectField, {Option} from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useFindPlaceById, useUpdatePlace } from "../../../hooks/places";
import { kinds, search } from "../../../libs/places";
import { ActorContext } from "../../../stores/actor";
import Avatar from "../../users/Avatar";

interface Props {
    place: Place;
    onEditUser: (user: Profile) => void;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().required().min(3).max(96),
    description: yup.string().required().min(3).max(1024),
    icon: yup.string().required().min(3).max(512),
    kind: yup.number().required(),
    parentId: yup.array(yup.number().required().min(1)).required(),
    private: yup.bool(),
});

const EditForm = (props: Props) => {
    const [actorContext, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<PlaceRequest>({
        name: props.place.name,
        description: props.place.description,
        icon: props.place.icon,
        kind: props.place.kind,
        private: props.place.private,
        parentId: props.place.parentId,
    });

    const updateMut = useUpdatePlace();
    const parent = useFindPlaceById(props.place.parentId.length > 0? props.place.parentId[0] || 0: 0);

    const changeForm = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field]: value
        }));
    }, []);

    const changeFormOpt = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field]: [value]
        }));
    }, []);

    const validate = async (form: PlaceRequest): Promise<string[]> => {
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
                pubId: props.place.pubId,
                req: {
                    name: form.name,
                    description: form.description,
                    icon: form.icon,
                    kind: Number(form.kind),
                    private: form.private,
                    parentId: form.parentId.length > 0? [Number(form.parentId[0])]: [],
                }
            });
            props.onSuccess('Place updated!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, actorContext.main, props.onClose]);

    const handleSearchPlace = useCallback(async (
        value: string
    ): Promise<Option[]> => {
        try {
            return search(value);
        }
        catch(e) {
            props.onError(e);
            return [];
        }
    }, []);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    useEffect(() => {
        setForm({
            name: props.place.name,
            description: props.place.description,
            icon: props.place.icon,
            kind: props.place.kind,
            private: props.place.private,
            parentId: props.place.parentId,
        });
    }, [props.place]);

    const {place} = props;
    
    return (
        <form onSubmit={handleUpdate}>
            <TextField
                label="Id"
                name="id"
                value={place.pubId}
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
                value={form.description}
                required={true}
                rows={5}
                onChange={changeForm}
            />
            <TextField 
                label="Icon"
                name="icon"
                value={form.icon}
                required={true}
                onChange={changeForm}
            />            
            <SelectField
                label="Kind"
                name="kind"
                value={form.kind}
                options={kinds}
                onChange={changeForm}
            />
            <CheckboxField 
                label="Private"
                id="private"
                value={form.private}
                onChange={changeForm}
            />
            <AutocompleteField
                label="Parent"
                name="parentId"
                value={parent.data?.name || ''}
                onSearch={handleSearchPlace}
                onChange={changeFormOpt}
            />      
            <div className="field">
                <label className="label">
                    Author
                </label>
                <div className="control">
                    <Avatar 
                        id={place.createdBy} 
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