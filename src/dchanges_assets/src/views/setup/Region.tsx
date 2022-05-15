import React, {useCallback, useState} from "react";
import * as yup from 'yup';
import Button from '../../components/Button';
import TextField from "../../components/TextField";
import Container from "../../components/Container";
import Panel from "../../components/Panel";
import {RegionRequest} from "../../../../declarations/dchanges/dchanges.did";
import { kinds, RegionKind } from "../../libs/regions";
import SelectField from "../../components/SelectField";

interface Props {
    onCreate: (req: RegionRequest) => void,
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(32),
    kind: yup.number().required(),
    private: yup.bool().required(),
    parent: yup.array(yup.number().required()).max(1),
});

const RegionSetupForm = (props: Props) => {
    const [form, setForm] = useState<RegionRequest>({
        name: '',
        kind: RegionKind.OTHER,
        private: false,
        parentId: [],
    });
    
    const changeForm = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field]: value
        }));
    }, []);

    const validate = async (form: RegionRequest): Promise<string[]> => {
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
            kind: form.kind, 
            parentId: form.parentId,
            private: form.private,
        });
    }, [props.onCreate, form]);

    return (
        <form onSubmit={handleCreate}>
            <Panel label="Region registration">
                <Container>
                    <TextField 
                        label="Name"
                        name="name"
                        value={form.name || ''}
                        required={true}
                        onChange={changeForm} 
                    />
                    <SelectField
                        label="Kind"
                        id="kind"
                        value={form.kind}
                        options={kinds}
                        onChange={changeForm}
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
            </Panel>

        </form>
    );
};

export default RegionSetupForm;