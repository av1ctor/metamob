import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { RegionRequest } from "../../../../declarations/dchanges/dchanges.did";
import Button from "../../components/Button";
import CheckboxField from "../../components/CheckboxField";
import SelectField, { Option } from "../../components/SelectField";
import TextField from "../../components/TextField";
import { useCreateRegion } from "../../hooks/regions";
import { search } from "../../libs/regions";
import { ActorContext } from "../../stores/actor";

interface Props {
    value: string;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    onCancel: () => void;
}

const formSchema = yup.object().shape({
    name: yup.string().min(3).max(96),
    parentId: yup.array(yup.number().required().min(1)).required(),
    private: yup.bool(),
});

const Create = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<RegionRequest>({
        name: props.value,
        private: false,
        parentId: [],
    });

    const mutation = useCreateRegion(['regions']);
    
    const changeForm = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field]: field === 'parentId'? [Number(value)]: value
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
        
        try {
            await mutation.mutateAsync({
                main: actorState.main,
                req: {
                    name: form.name,
                    private: form.private,
                    parentId: form.parentId,
                }
            });

            props.onSuccess('Region created!');
            props.onCancel();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form]);

    const handleSearchRegion = useCallback(async (
        value: string
    ): Promise<Option[]> => {
        try {
            return search(value);
        }
        catch(e) {
            props.onError(e);
            return [];
        }
    }, []);

    useEffect(() => {
        setForm(form => ({
            ...form,
            name: props.value
        }));
    }, [props.value]);
   
    return (
        <form onSubmit={handleCreate}>
            <div>
                <TextField 
                    label="Name"
                    name="name"
                    value={form.name}
                    disabled={true}
                />            
                <CheckboxField 
                    label="Private"
                    id="private"
                    value={form.private}
                    onChange={changeForm}
                />
                <SelectField
                    label="Parent"
                    name="parentId"
                    value=""
                    options={handleSearchRegion}
                    onChange={changeForm}
                />            
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleCreate}
                        >
                            Create
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={props.onCancel}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default Create;