import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { PlaceRequest } from "../../../../../declarations/dchanges/dchanges.did";
import AutocompleteField from "../../../components/AutocompleteField";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import SelectField, { Option } from "../../../components/SelectField";
import TextField from "../../../components/TextField";
import { useCreatePlace } from "../../../hooks/places";
import { kinds, PlaceKind, search } from "../../../libs/places";
import { ActorContext } from "../../../stores/actor";

interface Props {
    value?: string;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    onClose: () => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().required().min(3).max(96),
    kind: yup.number().required(),
    parentId: yup.array(yup.number().required().min(1)).required(),
    private: yup.bool(),
});

const Create = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<PlaceRequest>({
        name: props.value || '',
        kind: PlaceKind.OTHER,
        private: false,
        parentId: [],
    });

    const mutation = useCreatePlace(['places']);
    
    const changeForm = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field]: field === 'parentId'? [Number(value)]: value
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

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = await validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }
        
        try {
            props.toggleLoading(true);

            await mutation.mutateAsync({
                main: actorState.main,
                req: {
                    name: form.name,
                    kind: Number(form.kind),
                    private: form.private,
                    parentId: form.parentId,
                }
            });

            props.onSuccess('Place created!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, props.onClose]);

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
            name: props.value || '',
            kind: PlaceKind.OTHER,
            private: false,
            parentId: [],
        });
    }, [props.value]);
   
    return (
        <form onSubmit={handleCreate}>
            <div>
                <TextField 
                    label="Name"
                    name="name"
                    value={form.name}
                    required={true}
                    onChange={changeForm}
                />            
                <SelectField
                    label="Kind"
                    id="kind"
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
                    value=""
                    onSearch={handleSearchPlace}
                    onChange={changeForm}
                />            
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleCreate}
                        >
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