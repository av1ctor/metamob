import React, { useCallback, useContext, useState } from "react"
import * as yup from 'yup';
import {dchanges} from "../../../../declarations/dchanges";
import { AuthActionType, AuthContext } from "../../stores/auth";
import Button from "../../components/Button";
import Grid from "../../components/Grid";
import TextField from "../../components/TextField";
import {ProfileRequest, Role } from "../../../../declarations/dchanges/dchanges.did";
import { ActorContext } from "../../stores/actor";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(64),
    email: yup.string().min(3).max(128),
    avatar: yup.array(yup.string()).required(),
});

const Profile = (props: Props) => {
    const [authState, authDispatch] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);

    const [form, setForm] = useState<ProfileRequest>({
        name: '',
        email: '',
        avatar: [],
        roles: [] as any,
        active: [],
        banned: [],
        countryId: 0,
        ...authState.user
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
            const req: ProfileRequest = {
                name: form.name, 
                email: form.email, 
                avatar: form.avatar,
                roles: [],
                active: [],
                banned: [],
                countryId: 0,
            };

            if(!actorState.main) {
                return;
            }
            
            const res = await actorState.main.userUpdateMe(req);
            
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
    }, [form]);

    return (
        <form onSubmit={handleUpdate}>
            <Grid container>
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
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleUpdate}>
                            Update
                        </Button>
                    </div>
                </div>
            </Grid>
        </form>        
    )
};

export default Profile;