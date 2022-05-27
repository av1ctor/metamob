import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { PlaceRequest, PlaceRestriction } from "../../../../../declarations/dchanges/dchanges.did";
import AutocompleteField from "../../../components/AutocompleteField";
import Button from "../../../components/Button";
import SelectField, { Option } from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useCreatePlace } from "../../../hooks/places";
import { kinds, PlaceKind, PlaceRestrictionNum, restrictions, restrictionToEnum, search } from "../../../libs/places";
import { setField } from "../../../libs/utils";
import { ActorContext } from "../../../stores/actor";
import { transformRestriction, validateRestriction } from "./utils";

interface Props {
    value?: string;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    onClose: () => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().required().min(3).max(96),
    description: yup.string().required().min(3).max(1024),
    icon: yup.string().required().min(3).max(512),
    kind: yup.number().required(),
    parentId: yup.array(yup.number().required().min(1)).required(),
    restriction: yup.object().test({
        test: validateRestriction
    }).required(),
});

const Create = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<PlaceRequest>({
        name: props.value || '',
        description: '',
        icon: '',
        kind: PlaceKind.OTHER,
        restriction: {none: null},
        parentId: [],
    });

    const mutation = useCreatePlace();
    
    const changeForm = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => setField(form, field, field === 'parentId'? [Number(value)]: value));
    }, []);

    const changeRestriction = useCallback((e: any) => {
        let value: PlaceRestriction = {none: null};
        switch(Number(e.target.value)) {
            case PlaceRestrictionNum.EMAIL:
                value = {email: null};
                break;
            case PlaceRestrictionNum.DIP20:
                value = {dip20: {
                    canisterId: '',
                    minValue: BigInt(0),
                }};
                break;
            case PlaceRestrictionNum.DIP721:
                value = {dip721: {
                    canisterId: '',
                    minValue: BigInt(0),
                }};
                break;
        }

        setForm(form => ({
            ...form,
            restriction: value
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
                    description: form.description,
                    icon: form.icon,
                    kind: Number(form.kind),
                    restriction: transformRestriction(form.restriction),
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
            description: '',
            icon: '',
            kind: PlaceKind.OTHER,
            restriction: {none: null},
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
                    id="kind"
                    value={form.kind}
                    options={kinds}
                    onChange={changeForm}
                />
                <SelectField 
                    label="Restriction"
                    id="restriction"
                    value={restrictionToEnum(form.restriction)}
                    options={restrictions}
                    onChange={changeRestriction}
                />
                {'dip20' in form.restriction &&
                    <div className="p-2 border">
                        <TextField 
                            label="Canister Id"
                            name="restriction.dip20.canisterId"
                            value={form.restriction.dip20.canisterId}
                            required={true}
                            onChange={changeForm}
                        />
                        <TextField 
                            label="Min value"
                            name="restriction.dip20.minValue"
                            value={String(form.restriction.dip20.minValue)}
                            required={true}
                            onChange={changeForm}
                        />
                    </div>
                }
                {'dip721' in form.restriction &&
                    <div className="p-2 border">
                        <TextField 
                            label="Canister Id"
                            name="restriction.dip721.canisterId"
                            value={form.restriction.dip721.canisterId}
                            required={true}
                            onChange={changeForm}
                        />
                        <TextField 
                            label="Min value"
                            name="restriction.dip721.minValue"
                            value={String(form.restriction.dip721.minValue)}
                            required={true}
                            onChange={changeForm}
                        />
                    </div>
                }
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