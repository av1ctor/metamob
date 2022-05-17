import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { ProfileRequest, Profile, Role } from "../../../../../declarations/dchanges/dchanges.did";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import SelectField, { Option } from "../../../components/SelectField";
import TextField from "../../../components/TextField";
import { useUpdateUser } from "../../../hooks/users";
import { ActorContext } from "../../../stores/actor";

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
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
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
    banned: yup.array(yup.boolean()).required(),
    countryId: yup.number().required(),
});

const roles: Option[] = [
    {name: 'admin', value: 'admin'},
    {name: 'moderator', value: 'moderator'},
    {name: 'user', value: 'user'},
];

const EditForm = (props: Props) => {
    const [actorContext, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<ProfileRequest>({
        name: props.user.name,
        email: props.user.email,
        avatar: props.user.avatar,
        roles: [props.user.roles],
        active: [props.user.active],
        banned: [props.user.banned],
        countryId: props.user.countryId
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

    const validate = async (form: ProfileRequest): Promise<string[]> => {
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
            await updateMut.mutateAsync({
                main: actorContext.main,
                pubId: props.user.pubId, 
                req: {
                    name: form.name, 
                    email: form.email, 
                    avatar: form.avatar,
                    roles: form.roles,
                    active: form.active,
                    banned: form.banned,
                    countryId: form.countryId,
                }
            });
            props.onSuccess('User updated!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form, actorContext.main, props.onClose]);

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
            countryId: props.user.countryId
        });
    }, [props.user]);
    
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
            <TextField 
                label="Avatar"
                name="avatar"
                value={form.avatar[0] || ''}
                required={true}
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
                label="Banned"
                id="banned"
                value={form.banned[0] || false}
                onChange={changeFormOpt}
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

