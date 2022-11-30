import React, { useCallback, useEffect, useState } from "react";
import * as yup from 'yup';
import { ProfileRequest, Profile, Role } from "../../../../../declarations/metamob/metamob.did";
import { AvatarPicker } from "../../../components/AvatarPicker";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import SelectField, { Option } from "../../../components/SelectField";
import TextField from "../../../components/TextField";
import { useUI } from "../../../hooks/ui";
import { useUpdateUser } from "../../../hooks/users";
import countries from "../../../libs/countries";
import { Banned } from "../../../libs/users";

function rolesToString(
    roles: Role[] | undefined
): string {
    if(!roles || roles.length === 0) {
        return 'user';
    }

    const role0 = roles[0];
    if('admin' in role0) {
        return 'admin';
    }
    else if('moderator' in role0) {
        return 'moderator';
    }
    else {
        return 'user';
    }
}

interface Props {
    user: Profile;
    onClose: () => void;

}

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(64),
    email: yup.string().min(3).max(128),
    avatar: yup.array(yup.string()).required(),
    roles: yup.array(yup.array(yup.object().shape({
        admin: yup.mixed(),
        moderator: yup.mixed(),
        user: yup.mixed(),
    }))).required(),
    active: yup.array(yup.boolean()).required(),
    banned: yup.array(yup.number()).required(),
    country: yup.string().required(),
});

const roles: Option[] = [
    {name: 'admin', value: 'admin'},
    {name: 'moderator', value: 'moderator'},
    {name: 'user', value: 'user'},
];

const EditForm = (props: Props) => {
    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState<ProfileRequest>({
        name: props.user.name,
        email: props.user.email,
        avatar: props.user.avatar,
        roles: [props.user.roles],
        active: [props.user.active],
        banned: [props.user.banned],
        country: props.user.country
    });

    const updateMut = useUpdateUser();

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

    const changeBanned = useCallback((e: any, kind: Banned) => {
        const checked = e.target.checked;
        setForm(form => ({
            ...form,
            banned: [((form.banned[0] || 0) & ~kind) | (checked? kind: 0)]
        }));
    }, []);

    const changeRoles = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            roles: [
                [
                    {
                        [e.target.value]: null
                    } as Role
                ]
            ]
        }));
    }, []);

    const validate = (form: ProfileRequest): string[] => {
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

        try {
            toggleLoading(true);

            await updateMut.mutateAsync({
                pubId: props.user.pubId, 
                req: form
            });
            showSuccess('User updated!');
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    useEffect(() => {
        setForm({
            name: props.user.name,
            email: props.user.email,
            avatar: props.user.avatar,
            roles: [props.user.roles],
            active: [props.user.active],
            banned: [props.user.banned],
            country: props.user.country
        });
    }, [props.user]);

    const banned = form.banned[0] || Banned.None;
    
    return (
        <form onSubmit={handleUpdate}>
            <TextField 
                label="Id"
                name="id"
                value={props.user.pubId}
                disabled={true}
            />
            <TextField 
                label="Name"
                name="name"
                value={form.name || ''}
                required={true}
                onChange={changeForm} 
            />
            <TextField 
                label="E-mail"
                name="email"
                value={form.email || ''}
                required={true}
                onChange={changeForm} 
            />
            <SelectField
                label="Country"
                name="country"
                value={form.country}
                options={countries.map(c => ({name: c.name, value: c.code}))}
                onChange={changeForm}
            />
            <AvatarPicker 
                label="Avatar"
                name="avatar"
                value={form.avatar[0] || ''}
                onChange={changeFormOpt} 
            />
            <SelectField
                label="Roles"
                name="roles"
                value={rolesToString(form.roles[0]) || ''}
                required={true}
                options={roles}
                onChange={changeRoles} 
            />
            <CheckboxField
                label="Active"
                id="active"
                value={form.active[0] || false}
                onChange={changeFormOpt}
            />
            <CheckboxField
                label="Banned as user"
                id="banned0"
                value={(banned & Banned.AsUser) != 0}
                onChange={(e) => changeBanned(e, Banned.AsUser)}
            />
            <CheckboxField
                label="Banned as moderator"
                id="banned1"
                value={(banned & Banned.AsModerator) != 0}
                onChange={(e) => changeBanned(e, Banned.AsModerator)}
            />
            <CheckboxField
                label="Banned as admin"
                id="banned2"
                value={(banned & Banned.AsAdmin) != 0}
                onChange={(e) => changeBanned(e, Banned.AsAdmin)}
            />
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

