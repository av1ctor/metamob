import React, {useState} from "react";
import Button from '../../components/Button';
import TextField from "../../components/TextField";
import Grid from "../../components/Grid";
import Panel from "../../components/Panel";
import {ProfileRequest } from "../../../../declarations/dchanges/dchanges.did";

interface AdminSetupFormProps {
    onCreate: (req: ProfileRequest) => void,
};

const AdminSetupForm = (props: AdminSetupFormProps) => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        avatar: '',
    });
    
    const changeForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({
            ...form, 
            [e.target.name]: e.target.value
        })
    };
    
    return (
        <div>
            <Panel label="Admin registration">
                <Grid container>
                    <Grid>
                        <TextField 
                            label="Name"
                            name="name"
                            value={form.name || ''}
                            required={true}
                            onChange={changeForm} 
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid>
                        <TextField 
                            label="Avatar"
                            name="avatar"
                            value={form.avatar || ''}
                            onChange={changeForm} 
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid>
                        <Button
                            onClick={() => props.onCreate({
                                name: form.name, 
                                email: form.email, 
                                avatar: [form.avatar],
                                roles: [[{admin: null}]],
                                active: [true],
                                banned: [false],
                                countryId: 0,
                            })}>
                            Create
                        </Button>
                    </Grid>
                </Grid>
            </Panel>

        </div>
    );
};

export default AdminSetupForm;