import React, { useCallback, useContext, useEffect, useState } from "react";
import * as yup from 'yup';
import { Profile, Region, RegionRequest } from "../../../../../declarations/dchanges/dchanges.did";
import AutocompleteField from "../../../components/AutocompleteField";
import Button from "../../../components/Button";
import CheckboxField from "../../../components/CheckboxField";
import SelectField, {Option} from "../../../components/SelectField";
import TextField from "../../../components/TextField";
import { useFindRegionById, useUpdateRegion } from "../../../hooks/regions";
import { kinds, search } from "../../../libs/regions";
import { ActorContext } from "../../../stores/actor";
import Avatar from "../../users/Avatar";

interface Props {
    region: Region;
    onEditUser: (user: Profile) => void;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
}

const formSchema = yup.object().shape({
    name: yup.string().required().min(3).max(96),
    kind: yup.number().required(),
    parentId: yup.array(yup.number().required().min(1)).required(),
    private: yup.bool(),
});

const EditForm = (props: Props) => {
    const [actorContext, ] = useContext(ActorContext);
    
    const [form, setForm] = useState<RegionRequest>({
        name: props.region.name,
        kind: props.region.kind,
        private: props.region.private,
        parentId: props.region.parentId,
    });

    const updateMut = useUpdateRegion(['regions']);
    const parent = useFindRegionById(['regions', props.region.parentId], props.region.parentId.length > 0? props.region.parentId[0] || 0: 0);

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

    const validate = async (form: RegionRequest): Promise<string[]> => {
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
                pubId: props.region.pubId,
                req: {
                    name: form.name,
                    kind: Number(form.kind),
                    private: form.private,
                    parentId: form.parentId.length > 0? [Number(form.parentId[0])]: [],
                }
            });
            props.onSuccess('Region updated!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form, actorContext.main, props.onClose]);

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

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);
    
    useEffect(() => {
        setForm({
            name: props.region.name,
            kind: props.region.kind,
            private: props.region.private,
            parentId: props.region.parentId,
        });
    }, [props.region]);

    const {region} = props;
    
    return (
        <form onSubmit={handleUpdate}>
            <TextField
                label="Id"
                name="id"
                value={region.pubId}
                disabled
            />
            <TextField 
                label="Name"
                name="name"
                value={form.name}
                required={true}
                onChange={changeForm}
            />            
            <SelectField
                label="Kind"
                name="kind"
                value={form.kind}
                options={kinds}
                onChange={changeForm}
            />
            <CheckboxField 
                label="Private"
                id="private"
                value={form.private}
                onChange={changeForm}
            />
            <AutocompleteField
                label="Parent"
                name="parentId"
                value={parent.data?.name || ''}
                onSearch={handleSearchRegion}
                onChange={changeFormOpt}
            />      
            <div className="field">
                <label className="label">
                    Author
                </label>
                <div className="control">
                    <Avatar 
                        id={region.createdBy} 
                        size='lg'
                        onClick={props.onEditUser}
                    />
                </div>
            </div>
            
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