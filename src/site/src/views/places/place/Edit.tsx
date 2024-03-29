import React, { useCallback, useEffect, useState } from "react";
import * as yup from 'yup';
import { Place, PlaceRequest, PlaceAuth } from "../../../../../declarations/metamob/metamob.did";
import AutocompleteField from "../../../components/AutocompleteField";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import { FlagPicker } from "../../../components/FlagPicker";
import MarkdownField from "../../../components/MarkdownField";
import { PlacePicker } from "../../../components/PlacePicker";
import SelectField, {Option} from "../../../components/SelectField";
import TextAreaField from "../../../components/TextAreaField";
import TextField from "../../../components/TextField";
import { useFindPlaceById, useModeratePlace, useUpdatePlace } from "../../../hooks/places";
import { kinds, PlaceAuthNum, auths, authToEnum, search, PlaceKind } from "../../../libs/places";
import { e2sToDecimal, setField } from "../../../libs/utils";
import Avatar from "../../users/Avatar";
import { transformAuth, validateAuth } from "./utils";
import { isModerator } from "../../../libs/users";
import CreateModerationForm, { transformModerationForm, useModerationForm, useSetModerationFormField, validateModerationForm } from "../../moderations/moderation/Create";
import { FormattedMessage } from "react-intl";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";
import { useActors } from "../../../hooks/actors";

interface Props {
    place: Place;
    reportId?: number | null;
    onEditEmails?: () => void;
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
    lat: yup.number().required(),
    lng: yup.number().required(),
});

const EditForm = (props: Props) => {
    const {metamob} = useActors();
    const {user} = useAuth();

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState<PlaceRequest>({
        name: props.place.name,
        description: props.place.description,
        icon: props.place.icon,
        banner: props.place.banner,
        terms: props.place.terms,
        kind: props.place.kind,
        auth: props.place.auth,
        parentId: props.place.parentId,
        active: props.place.active,
        lat: props.place.lat,
        lng: props.place.lng,
    });

    const [modForm, setModForm] = useModerationForm(props.reportId);

    const updateMut = useUpdatePlace();
    const moderateMut = useModeratePlace();

    const parent = useFindPlaceById(props.place.parentId && props.place.parentId.length > 0? props.place.parentId[0] || 0: 0);

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

    const changeModForm = useSetModerationFormField(setModForm);

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
                    minVotesPerc: BigInt(10 * 100),
                }};
                break;
            case PlaceAuthNum.DIP721:
                value = {dip721: {
                    canisterId: '',
                    createMin: BigInt(0),
                    cooperateMin: BigInt(0),
                    minVotesPerc: BigInt(10 * 100),
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

    const handleUpdate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        const isModeration = props.reportId && isModerator(user);

        if(isModeration) {
            const errors = validateModerationForm(modForm);
            if(errors.length > 0) {
                showError(errors);
                return;
            }
        }

        const transformReq = (): PlaceRequest => {
            return {
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
                parentId: form.parentId.length > 0? [Number(form.parentId[0])]: [],
                active: form.active,
                lat: Number(form.lat),
                lng: Number(form.lng),
            };
        };

        try {
            toggleLoading(true);

            if(isModeration) {
                await moderateMut.mutateAsync({
                    pubId: props.place.pubId,
                    req: transformReq(),
                    mod: transformModerationForm(modForm)
                });
                showSuccess('Place moderated!');
            }
            else {
                await updateMut.mutateAsync({
                    pubId: props.place.pubId,
                    req: transformReq(),
                });
                showSuccess('Place updated!');
            }

            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, modForm, props.onClose]);

    const handleSearchPlace = useCallback(async (
        value: string
    ): Promise<Option[]> => {
        try {
            return search(value, metamob);
        }
        catch(e) {
            showError(e);
            return [];
        }
    }, []);

    const handleEditEmails = useCallback((e: any) => {
        e.preventDefault();
        if(props.onEditEmails) {
            props.onEditEmails();
        }
    }, [props.onEditEmails]);

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
            banner: place.banner,
            terms: place.terms,
            kind: place.kind,
            auth: place.auth,
            parentId: place.parentId,
            active: place.active,
            lat: place.lat,
            lng: place.lng,
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
            <SelectField
                label="Kind"
                name="kind"
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
            {'email' in form.auth &&
                <div className="p-2 border has-text-centered">
                    <Button
                        disabled={!props.onEditEmails}
                        onClick={handleEditEmails}
                    >
                        Edit list
                    </Button>
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
                    <TextField 
                        label="Minimum votes percentage"
                        name="auth.dip20.minVotesPerc"
                        value={typeof form.auth.dip20.minVotesPerc === 'string'? form.auth.dip20.minVotesPerc: e2sToDecimal(form.auth.dip20.minVotesPerc)}
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
                    <TextField 
                        label="Minimum votes percentage"
                        name="auth.dip721.minVotesPerc"
                        value={typeof form.auth.dip721.minVotesPerc === 'string'? form.auth.dip721.minVotesPerc: e2sToDecimal(form.auth.dip721.minVotesPerc)}
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
                    <FormattedMessage id="Author" defaultMessage="Author"/>
                </label>
                <div className="control">
                    <Avatar 
                        id={place.createdBy} 
                        size='lg'
                    />
                </div>
            </div>
            {props.reportId && isModerator(user) &&
                <CreateModerationForm
                    form={modForm}
                    onChange={changeModForm}
                />
            }
            <div className="field is-grouped mt-2">
                <div className="control">
                    <Button
                        onClick={handleUpdate}
                        disabled={updateMut.isLoading}
                    >
                        <FormattedMessage id="Update" defaultMessage="Update"/>
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
        </form>
    );
};

export default EditForm;