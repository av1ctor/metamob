import React, { useCallback, useContext, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import * as yup from 'yup';
import { PlaceRequest, PlaceAuth } from "../../../../../declarations/metamob/metamob.did";
import AutocompleteField from "../../../components/AutocompleteField";
import Button from "../../../components/Button";
import { FlagPicker } from "../../../components/FlagPicker";
import MarkdownField from "../../../components/MarkdownField";
import { PlacePicker } from "../../../components/PlacePicker";
import SelectField, { Option } from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useCreatePlace } from "../../../hooks/places";
import { useUI } from "../../../hooks/ui";
import { kinds, PlaceKind, PlaceAuthNum, auths, authToEnum, search } from "../../../libs/places";
import { setField } from "../../../libs/utils";
import { ActorContext } from "../../../stores/actor";
import { transformAuth, validateAuth } from "./utils";

interface Props {
    onClose: () => void;
}

const formSchema = yup.object().shape({
    name: yup.string().required().min(3).max(96),
    description: yup.string().required().min(3).max(1024),
    icon: yup.string().required().min(2).max(512),
    banner: yup.array(yup.string().optional().max(512)),
    terms: yup.array(yup.string().optional().max(32768)),
    kind: yup.number().required(),
    parentId: yup.array(yup.number().required().min(1)).required(),
    auth: yup.object().test({
        test: validateAuth
    }).required(),
    active: yup.bool().required(),
    lat: yup.number().required(),
    lng: yup.number().required(),
});

const emptyForm = (): PlaceRequest => {
    return ({
        name: '',
        description: '',
        icon: '',
        banner: [''],
        terms: [''],
        kind: PlaceKind.OTHER,
        auth: {none: null},
        parentId: [],
        active: true,
        lat: 0,
        lng: 0,
    });
};

const Create = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const intl = useIntl();

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState<PlaceRequest>(emptyForm());

    const mutation = useCreatePlace();
    
    const changeForm = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => setField(form, field, field === 'parentId'? [Number(value)]: value));
    }, []);

    const changeFormOpt = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => setField(form, field, [value]));
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
                    createMin: BigInt(0),
                    cooperateMin: BigInt(0),
                }};
                break;
            case PlaceAuthNum.DIP721:
                value = {dip721: {
                    canisterId: '',
                    createMin: BigInt(0),
                    cooperateMin: BigInt(0),
                }};
                break;
        }

        setForm(form => ({
            ...form,
            auth: value
        }));
    }, []);

    const validate = (form: PlaceRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }
        
        try {
            toggleLoading(true);

            await mutation.mutateAsync({
                main: actors.main,
                req: {
                    name: form.name,
                    description: form.description,
                    icon: form.icon,
                    banner: form.banner[0]?
                        form.banner:
                        [],
                    terms: form.terms[0]?
                        form.terms:
                        [],
                    kind: Number(form.kind),
                    auth: transformAuth(form.auth),
                    parentId: form.parentId,
                    active: form.active,
                    lat: Number(form.lat),
                    lng: Number(form.lng),
                }
            });

            setForm(emptyForm());
            showSuccess(intl.formatMessage({defaultMessage: 'Place created!'}));
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, props.onClose]);

    const handleSearchPlace = useCallback(async (
        value: string
    ): Promise<Option[]> => {
        try {
            return search(value);
        }
        catch(e) {
            showError(e);
            return [];
        }
    }, []);

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
                <SelectField
                    label="Kind"
                    id="kind"
                    value={form.kind}
                    options={kinds}
                    onChange={changeForm}
                />
                {Number(form.kind) === PlaceKind.PLANET || Number(form.kind) === PlaceKind.CONTINENT?
                    <PlacePicker 
                        label="Icon"
                        name="icon"
                        value={form.icon}
                        onChange={changeForm}
                    />:
                        Number(form.kind) === PlaceKind.COUNTRY?
                            <FlagPicker
                                label="Icon"
                                name="icon"
                                value={form.icon}
                                onChange={changeForm}
                            />:
                            <TextField
                                label="Icon URL"
                                name="icon"
                                value={form.icon}
                                required
                                onChange={changeForm}
                            />
                }
                <TextField 
                    label="Banner URL"
                    name="banner"
                    value={form.banner[0] || ''}
                    onChange={changeFormOpt}
                />
                <TextField 
                    label="Latitude"
                    name="lat"
                    value={form.lat.toString()}
                    required={true}
                    onChange={changeForm}
                />
                <TextField 
                    label="Longitude"
                    name="lng"
                    value={form.lng.toString()}
                    required={true}
                    onChange={changeForm}
                />
                <MarkdownField 
                    label="Terms and conditions"
                    name="terms"
                    value={form.terms[0] || ''}
                    onChange={changeFormOpt}
                />
                <SelectField 
                    label="Authorization"
                    id="auth"
                    value={authToEnum(form.auth)}
                    options={auths}
                    onChange={changeAuth}
                />
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
                            label="Create min value"
                            name="auth.dip20.createMin"
                            value={String(form.auth.dip20.createMin)}
                            required={true}
                            onChange={changeForm}
                        />
                        <TextField 
                            label="Cooperate min value"
                            name="auth.dip20.cooperateMin"
                            value={String(form.auth.dip20.cooperateMin)}
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
                            label="Create min value"
                            name="auth.dip721.createMin"
                            value={String(form.auth.dip721.createMin)}
                            required={true}
                            onChange={changeForm}
                        />
                        <TextField 
                            label="Cooperate min value"
                            name="auth.dip721.cooperateMin"
                            value={String(form.auth.dip721.cooperateMin)}
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
                            <FormattedMessage id="Create" defaultMessage="Create"/>
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}
                        >
                            <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default Create;