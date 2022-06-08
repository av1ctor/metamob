import React, { useCallback, useContext, useEffect, useState } from "react"
import * as yup from 'yup';
import { AuthActionType, AuthContext } from "../../../stores/auth";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextField from "../../../components/TextField";
import {Profile, ProfileRequest } from "../../../../../declarations/metamob/metamob.did";
import { ActorContext } from "../../../stores/actor";
import { AvatarPicker } from "../../../components/AvatarPicker";
import { useFindUserById } from "../../../hooks/users";
import SelectField from "../../../components/SelectField";
import countries from "../../../libs/countries";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(64),
    email: yup.string().min(3).max(128),
    avatar: yup.array(yup.string()).required(),
    country: yup.string().required(),
});

const User = (props: Props) => {
    const [authState, authDispatch] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);

    const [form, setForm] = useState<ProfileRequest>({
        name: '',
        email: '',
        avatar: [],
        roles: [],
        active: [],
        banned: [],
        country: '',
    });

    const profile = useFindUserById(authState.user?._id || 0, actorState.main);

    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const changeFormOpt = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: [e.target.value]
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
            props.onError(errors);
            return;
        }

        try {
            props.toggleLoading(true);

            if(!actorState.main) {
                return;
            }
            
            const res = await actorState.main.userUpdateMe(form);
            
            if('ok' in res) {
                const user = res.ok;
                authDispatch({type: AuthActionType.SET_USER, payload: user});
                props.onSuccess('User updated!');
            }
            else {
                props.onError(res.err);
            }
        }
        catch(e: any) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form]);

    useEffect(() => {
        switch(profile.status) {
            case 'success':
                const full = profile.data as Profile;
                setForm({
                    name: full.name,
                    email: full.email,
                    avatar: full.avatar,
                    roles: [],
                    active: [],
                    banned: [],
                    country: full.country,
                });
                break;

            case 'error':
                props.onError(profile.error.message);
                break;
        }
        props.toggleLoading(profile.status === 'loading');
    }, [profile.status]);

    if(!authState.user) {
        return null;
    }

    return (
        <>
            <div className="page-title has-text-info-dark">
                My profile
            </div>
            
            <form onSubmit={handleUpdate}>
                <Container>
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
                    <div className="field is-grouped mt-2">
                        <div className="control">
                            <Button
                                onClick={handleUpdate}>
                                Update
                            </Button>
                        </div>
                    </div>
                </Container>
            </form>        
        </>
    )
};

export default User;