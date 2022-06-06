import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { Profile, Place, PlaceRequest, PlaceAuth } from "../../../../../declarations/dchanges/dchanges.did";
import AutocompleteField from "../../../components/AutocompleteField";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import { FlagPicker } from "../../../components/FlagPicker";
import { PlacePicker } from "../../../components/PlacePicker";
import SelectField, {Option} from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useFindPlaceById, useUpdatePlace } from "../../../hooks/places";
import { kinds, PlaceAuthNum, auths, authToEnum, search, PlaceKind } from "../../../libs/places";
import { setField } from "../../../libs/utils";
import { ActorContext } from "../../../stores/actor";
import { transformAuth, validateAuth } from "../../places/place/utils";
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
    auth: yup.object().test({
        test: validateAuth
    }).required(),
    active: yup.bool().required(),
});

const EditForm = (props: Props) => {
    const [actorContext, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<PlaceRequest>({
        name: props.place.name,
        description: props.place.description,
        icon: props.place.icon,
        kind: props.place.kind,
        auth: props.place.auth,
        parentId: props.place.parentId,
        active: props.place.active
    });

    const updateMut = useUpdatePlace();
    const parent = useFindPlaceById(props.place.parentId.length > 0? props.place.parentId[0] || 0: 0);

    const changeForm = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => setField(form, field, field === 'parentId'? [Number(value)]: value));
    }, []);

    const changeFormOpt = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field]: [value]
        }));
    }, []);

    const changeAuth = useCallback((e: any) => {
        let value: PlaceAuth = {none: null};
        switch(Number(e.target.value)) {
            case PlaceAuthNum.EMAIL:
                value = {email: null};
                break;
            case PlaceAuthNum.DIP20:
                value = {dip20: {
                    canisterId: '',
                    minValue: BigInt(0),
                }};
                break;
            case PlaceAuthNum.DIP721:
                value = {dip721: {
                    canisterId: '',
                    minValue: BigInt(0),
                }};
                break;
        }

        setForm(form => ({
            ...form,
            auth: value
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
                    auth: transformAuth(form.auth),
                    parentId: form.parentId.length > 0? [Number(form.parentId[0])]: [],
                    active: form.active,
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
        const {place} = props;
        setForm({
            name: place.name,
            description: place.description,
            icon: place.icon,
            kind: place.kind,
            auth: place.auth,
            parentId: place.parentId,
            active: place.active
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
            {form.kind === PlaceKind.COUNTRY?
                <FlagPicker
                    label="Icon"
                    name="icon"
                    value={form.icon}
                    onChange={changeForm}
                />:
                <PlacePicker
                    label="Icon"
                    name="icon"
                    value={form.icon}
                    onChange={changeForm}
                />
            }
            <SelectField
                label="Kind"
                name="kind"
                value={form.kind}
                options={kinds}
                onChange={changeForm}
            />
            <SelectField 
                label="Authorization"
                id="auth"
                value={authToEnum(form.auth)}
                options={auths}
                onChange={changeAuth}
            />
            {'email' in form.auth &&
                <div className="p-2 border has-text-centered">
                    List can only be edited by its creator
                </div>
            }
            {'dip20' in form.auth &&
                <div className="p-2 border">
                    <TextField 
                        label="Canister Id"
                        name="auth.dip20.canisterId"
                        value={form.auth.dip20.canisterId}
                        required={true}
                        onChange={changeForm}
                    />
                    <TextField 
                        label="Min value"
                        name="auth.dip20.minValue"
                        value={String(form.auth.dip20.minValue)}
                        required={true}
                        onChange={changeForm}
                    />
                </div>
            }
            {'dip721' in form.auth &&
                <div className="p-2 border">
                    <TextField 
                        label="Canister Id"
                        name="auth.dip721.canisterId"
                        value={form.auth.dip721.canisterId}
                        required={true}
                        onChange={changeForm}
                    />
                    <TextField 
                        label="Min value"
                        name="auth.dip721.minValue"
                        value={String(form.auth.dip721.minValue)}
                        required={true}
                        onChange={changeForm}
                    />
                </div>
            }
            <AutocompleteField
                label="Parent"
                name="parentId"
                value={parent.data?.name || ''}
                onSearch={handleSearchPlace}
                onChange={changeFormOpt}
            />
            <CheckboxField
                label="Active"
                id="active"
                value={form.active}
                onChange={changeForm}
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