import React, { useCallback, useContext, useState } from "react"
import * as yup from 'yup';
import {dchanges} from "../../../../declarations/dchanges";
import { AuthActionType, AuthContext } from "../../stores/auth";
import Button from "../../components/Button";
import Grid from "../../components/Grid";
import TextField from "../../components/TextField";
import {ProfileRequest } from "../../../../declarations/dchanges/dchanges.did";

interface Props {
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(64),
    email: yup.string().min(3).max(128),
    avatar: yup.string().required(),
});

const Create = (props: Props) => {
    const [state, dispatch] = useContext(AuthContext);

    const [form, setForm] = useState<ProfileRequest>({
        name: '',
        email: '',
        avatar: [],
        roles: [],
        active: [],
        banned: [],
        countryId: 0
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

    const handleCreate = useCallback(async (e: any) => {
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
            
            const res = await dchanges.userCreate(req);
            
            if('ok' in res) {
                const user = res.ok;
                dispatch({type: AuthActionType.SET_USER, payload: user});
                props.onSuccess('Admin created!');
            }
            else {
                props.onError(res.err);
            }
        }
        catch(e: any) {
            props.onError(e);
        }
    }, [form]);

    if(!state.client || !state.identity) {
        return null;
    }

    return (
        <form onSubmit={handleCreate}>
            <Grid container>
                <TextField 
                    label="Name"
                    name="name"
                    value={form.name || ''}
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
                            onClick={handleCreate}>
                            Create
                        </Button>
                    </div>
                </div>
            </Grid>
        </form>
    );
};

export default Create;