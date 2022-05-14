import React, {useCallback, useState} from "react";
import * as yup from 'yup';
import Button from '../../components/Button';
import TextField from "../../components/TextField";
import Container from "../../components/Container";
import {ProfileRequest} from "../../../../declarations/dchanges/dchanges.did";

interface Props {
    onCreate: (req: ProfileRequest) => void,
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(64),
    email: yup.string().min(3).max(128),
    avatar: yup.array(yup.string()).required(),
});

const AdminSetupForm = (props: Props) => {
    const [form, setForm] = useState<ProfileRequest>({
        name: '',
        email: '',
        avatar: [],
        roles: [[{admin: null}]],
        active: [true],
        banned: [false],
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
        
        props.onCreate({
            name: form.name, 
            email: form.email, 
            avatar: form.avatar,
            roles: [[{admin: null}]],
            active: [true],
            banned: [false],
            countryId: 0,
        });
    }, [props.onCreate, form]);
    
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
            </Container>
        </form>
    );
};

export default AdminSetupForm;