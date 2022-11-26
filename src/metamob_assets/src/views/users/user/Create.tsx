import React, { useCallback, useContext, useState } from "react"
import * as yup from 'yup';
import { AuthActionType, AuthContext } from "../../../stores/auth";
import Button from "../../../components/Button";
import Container from "../../../components/Container";
import TextField from "../../../components/TextField";
import {ProfileRequest } from "../../../../../declarations/metamob/metamob.did";
import { AvatarPicker } from "../../../components/AvatarPicker";
import SelectField from "../../../components/SelectField";
import countries from "../../../libs/countries";
import { ActorContext } from "../../../stores/actor";
import { useUI } from "../../../hooks/ui";

interface Props {
    onSuccess: (msg: string) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(64),
    email: yup.string().min(3).max(128),
    avatar: yup.array(yup.string().required()).required(),
    country: yup.string().required(),
});

const Create = (props: Props) => {
    const [actors, ] = useContext(ActorContext);
    const [auth, authDispatch] = useContext(AuthContext);

    const {showError, toggleLoading} = useUI();

    const [form, setForm] = useState<ProfileRequest>({
        name: '',
        email: '',
        avatar: [],
        roles: [],
        active: [],
        banned: [],
        country: ''
    });
    
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

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        try {
            toggleLoading(true);

            if(!actors.main) {
                throw Error('Main actor undefined');
            }
            
            const res = await actors.main.userCreate(form);

            if('ok' in res) {
                const user = res.ok;
                authDispatch({
                    type: AuthActionType.SET_USER, 
                    payload: user
                });
                props.onSuccess('User created!');
            }
            else {
                showError(res.err);
            }
        }
        catch(e: any) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form]);

    if(!auth.client || !auth.identity) {
        return null;
    }

    return (
        <form onSubmit={handleCreate}>
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
                            onClick={handleCreate}>
                            Create
                        </Button>
                    </div>
                </div>
            </Container>
        </form>
    );
};

export default Create;