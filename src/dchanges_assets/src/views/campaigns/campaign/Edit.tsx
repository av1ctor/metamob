import React, {useState, useCallback, useContext} from "react";
import * as yup from 'yup';
import {useUpdateCampaign} from "../../../hooks/campaigns";
import {Category, CampaignRequest, Campaign, Region} from "../../../../../declarations/dchanges/dchanges.did";
import TextField from "../../../components/TextField";
import SelectField, { Option } from "../../../components/SelectField";
import Grid from "../../../components/Grid";
import Button from "../../../components/Button";
import NumberField from "../../../components/NumberField";
import MarkdownField from "../../../components/MarkdownField";
import { ActorContext } from "../../../stores/actor";
import TagsField from "../../../components/TagsField";
import { useFindRegionById, useFindRegions } from "../../../hooks/regions";
import { search } from "../../../libs/regions";
import RegionForm from '../../regions/region/Create';
import Modal from "../../../components/Modal";
import AutocompleteField from "../../../components/AutocompleteField";

interface Props {
    campaign: Campaign;
    categories: Category[];
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
};

const formSchema = yup.object().shape({
    title: yup.string().min(10).max(128),
    target: yup.string().min(3).max(64),
    body: yup.string().min(100).max(4096),
    cover: yup.string().min(7).max(256),
    duration: yup.number().min(1).max(365),
    categoryId: yup.number().required().min(1),
    regionId: yup.number().required().min(1),
    tags: yup.array(yup.string().max(12)).max(5),
});

const EditForm = (props: Props) => {
    const [actorContext, ] = useContext(ActorContext);
    
    const [regionValue, setRegionValue] = useState('');
    const [form, setForm] = useState<CampaignRequest>({
        ...props.campaign
    });
    
    const updateMut = useUpdateCampaign();
    const region = useFindRegionById(['region-id', props.campaign.regionId], props.campaign.regionId);

    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

    const validate = async (form: CampaignRequest): Promise<string[]> => {
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
                pubId: props.campaign.pubId, 
                req: {
                    categoryId: Number(form.categoryId),
                    regionId: Number(form.regionId),
                    title: form.title,
                    target: form.target,
                    body: form.body,
                    cover: form.cover,
                    duration: Number(form.duration),
                    tags: form.tags
                }
            });
            props.onSuccess('Campaign updated!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
    }, [form, actorContext.main]);

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
    
    const showCreateRegion = useCallback((value: string) => {
        setRegionValue(value);
    }, []);

    const closeCreateRegion = useCallback(() => {
        setRegionValue('');
    }, []);    

    return (
        <>
            <form onSubmit={handleUpdate}>
                <Grid container>
                    <TextField 
                        label="Title" 
                        name="title"
                        value={form.title || ''}
                        required={true}
                        onChange={changeForm}
                    />
                    <TextField 
                        label="Target" 
                        name="target"
                        value={form.target || ''}
                        required={true}
                        onChange={changeForm}
                    />
                    <MarkdownField
                        label="Body"
                        name="body"
                        value={form.body || ''}
                        rows={6}
                        onChange={changeForm}
                    />
                    <TextField 
                        label="Cover image" 
                        name="cover"
                        value={form.cover || ''}
                        required={true}
                        onChange={changeForm}
                    />
                    <NumberField 
                        label="Duration (in days)" 
                        name="duration"
                        value={form.duration}
                        required={true}
                        onChange={changeForm}
                    />
                    <SelectField
                        label="Category"
                        name="categoryId"
                        value={form.categoryId}
                        options={props.categories.map((cat) => ({name: cat.name, value: cat._id}))}
                        required={true}
                        onChange={changeForm}
                    />
                    <AutocompleteField
                        label="Region"
                        name="regionId"
                        value={region.data?.name || ''}
                        required={true}
                        onSearch={handleSearchRegion}
                        onChange={changeForm}
                        onAdd={showCreateRegion}
                    />
                    <TagsField 
                        label="Tags"
                        name="tags"
                        value={form.tags}
                        maxTags={5}
                        onChange={changeForm} 
                    />
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
                                onClick={props.onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Grid>
            </form>

            <Modal
                isOpen={!!regionValue}
                onClose={closeCreateRegion}
            >
                <RegionForm 
                    value={regionValue}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    onClose={closeCreateRegion}
                />
            </Modal>            
        </>
    );
};

export default EditForm;