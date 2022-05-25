import React, {useState, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import {useUpdateCampaign} from "../../../hooks/campaigns";
import {Category, CampaignRequest, Campaign} from "../../../../../declarations/dchanges/dchanges.did";
import TextField from "../../../components/TextField";
import SelectField, { Option } from "../../../components/SelectField";
import Button from "../../../components/Button";
import NumberField from "../../../components/NumberField";
import MarkdownField from "../../../components/MarkdownField";
import { ActorContext } from "../../../stores/actor";
import TagsField from "../../../components/TagsField";
import { useFindPlaceById } from "../../../hooks/places";
import { search } from "../../../libs/places";
import PlaceForm from '../../places/place/Create';
import Modal from "../../../components/Modal";
import AutocompleteField from "../../../components/AutocompleteField";
import { AuthContext } from "../../../stores/auth";
import { isModerator } from "../../../libs/users";
import { CampaignKind, CampaignState, getGoalValue, kindOptions } from "../../../libs/campaigns";
import { decimalToIcp, icpToDecimal } from "../../../libs/utils";

interface Props {
    campaign: Campaign;
    categories: Category[];
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const states: Option[] = [
    {name: 'Created', value: CampaignState.CREATED},
    {name: 'Canceled', value: CampaignState.CANCELED},
    {name: 'Deleted', value: CampaignState.DELETED},
    {name: 'Published', value: CampaignState.PUBLISHED},
    {name: 'Finished', value: CampaignState.FINISHED},
    {name: 'Banned', value: CampaignState.BANNED},
];

const formSchema = yup.object().shape({
    kind: yup.number().required(),
    goal: yup.number().required().min(1),
    state: yup.array(yup.number().min(1)).required(),
    title: yup.string().min(10).max(128),
    target: yup.string().min(3).max(64),
    body: yup.string().min(100).max(4096),
    cover: yup.string().min(7).max(256),
    duration: yup.number().min(1).max(365),
    categoryId: yup.number().required().min(1),
    placeId: yup.number().required().min(1),
    tags: yup.array(yup.string().max(12)).max(5),
});

const EditForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext)
    const [authState, ] = useContext(AuthContext);
    
    const [placeValue, setPlaceValue] = useState('');
    const [form, setForm] = useState({
        ...props.campaign,
        state: [props.campaign.state],
        goal: props.campaign.kind === CampaignKind.DONATIONS?
            icpToDecimal(getGoalValue(props.campaign)):
            getGoalValue(props.campaign),
    });
    
    const updateMut = useUpdateCampaign();
    const place = useFindPlaceById(props.campaign.placeId);

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

    const validate = async (form: any): Promise<string[]> => {
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
            props.toggleLoading(true);

            const kind = Number(form.kind);

            await updateMut.mutateAsync({
                main: actorState.main,
                pubId: props.campaign.pubId, 
                req: {
                    kind: kind,
                    goal: kind === CampaignKind.DONATIONS?
                        decimalToIcp(form.goal.toString()):
                        BigInt(form.goal),
                    state: form.state.length > 0? [Number(form.state[0])]: [],
                    categoryId: Number(form.categoryId),
                    placeId: Number(form.placeId),
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
        finally {
            props.toggleLoading(false);
        }
    }, [form, actorState.main, props.onClose]);

    const handleSearchPlace = useCallback(async (
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
    
    const showCreatePlace = useCallback((value: string) => {
        setPlaceValue(value);
    }, []);

    const closeCreatePlace = useCallback(() => {
        setPlaceValue('');
    }, []);

    useEffect(() => {
        setForm({
            ...props.campaign,
            state: [props.campaign.state],
            goal: props.campaign.kind === CampaignKind.DONATIONS?
                icpToDecimal(getGoalValue(props.campaign)):
                getGoalValue(props.campaign),
        });
    }, [props.campaign]);

    return (
        <>
            <form onSubmit={handleUpdate}>
                <SelectField 
                    label="Kind"
                    name="kind"
                    value={form.kind}
                    options={kindOptions}
                    required={true}
                    disabled={true}
                />
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
                <TextField 
                    label={`Goal ${form.kind === CampaignKind.DONATIONS? '(ICP)': form.kind === CampaignKind.SIGNATURES? '(Signatures)': '(Votes)'}`}
                    name="goal"
                    value={form.goal.toString()}
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
                    label="Place"
                    name="placeId"
                    value={place.data?.name || ''}
                    required={true}
                    onSearch={handleSearchPlace}
                    onChange={changeForm}
                    onAdd={showCreatePlace}
                />
                <TagsField 
                    label="Tags"
                    name="tags"
                    value={form.tags}
                    maxTags={5}
                    onChange={changeForm} 
                />
                {authState.user && isModerator(authState.user) &&
                    <SelectField
                        label="State"
                        name="state"
                        value={form.state.length > 0 ? form.state[0] || 0: 0}
                        options={states}
                        onChange={changeFormOpt}
                    />                    
                }
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

            <Modal
                header={<span>Create place</span>}
                isOpen={!!placeValue}
                isOverOtherModal={true}
                onClose={closeCreatePlace}
            >
                <PlaceForm 
                    value={placeValue}
                    onSuccess={props.onSuccess}
                    onError={props.onError}
                    onClose={closeCreatePlace}
                    toggleLoading={props.toggleLoading}
                />
            </Modal>            
        </>
    );
};

export default EditForm;