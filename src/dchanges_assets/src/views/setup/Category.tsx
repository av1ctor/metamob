import React, {useState} from "react";
import Button from '../../components/Button';
import TextField from "../../components/TextField";
import Grid from "../../components/Grid";
import Panel from "../../components/Panel";
import ColorField from "../../components/ColorField";
import {CategoryRequest} from "../../../../declarations/dchanges/dchanges.did";

interface CategorySetupFormProps {
    onCreate: (req: CategoryRequest) => void,
};

const CategorySetupForm = (props: CategorySetupFormProps) => {
    const [form, setForm] = useState({
        name: '',
        color: '',
        description: '',
    });
    
    const changeForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({
            ...form, 
            [e.target.name]: e.target.value
        })
    };

    return (
        <div>
            <Panel label="Category registration">
                <Grid container>
                    <Grid>
                        <TextField 
                            label="Name"
                            name="name"
                            value={form.name || ''}
                            onChange={changeForm} 
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid>
                        <TextField 
                            label="Description"
                            name="description"
                            value={form.description || ''}
                            onChange={changeForm} 
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid>
                        <ColorField
                            label="Color"
                            name="color"
                            value={form.color || '#8abdf5'}
                            onChange={changeForm} 
                        />
                    </Grid>
                </Grid>
                <Grid container>
                    <Grid>
                        <Button
                            onClick={() => props.onCreate({
                                name: form.name, 
                                color: form.color,
                                description: form.description,
                            })}>
                            Create
                        </Button>
                    </Grid>
                </Grid>
            </Panel>

        </div>
    );
};

export default CategorySetupForm;