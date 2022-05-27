import React, {useState, useCallback, useContext} from "react";
import * as yup from 'yup';
import Button from '../../../components/Button';
import TextField from "../../../components/TextField";
import SelectField, { Option } from "../../../components/SelectField";
import Container from "../../../components/Container";
import {Category, CampaignRequest} from "../../../../../declarations/dchanges/dchanges.did";
import NumberField from "../../../components/NumberField";
import MarkdownField from "../../../components/MarkdownField";
import { ActorContext } from "../../../stores/actor";
import TagsField from "../../../components/TagsField";
import { search } from "../../../libs/places";
import PlaceForm from '../../places/place/Create';
import Modal from "../../../components/Modal";
import AutocompleteField from "../../../components/AutocompleteField";
import { CampaignKind, kindOptions } from "../../../libs/campaigns";
import { decimalToIcp } from "../../../libs/icp";

interface Props {
    mutation: any;
    categories: Category[];
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    kind: yup.number().required(),
    goal: yup.number().required().min(1),
    state: yup.array().required(),
    title: yup.string().min(10).max(128),
    target: yup.string().min(3).max(64),
    body: yup.string().min(100).max(4096),
    cover: yup.string().min(7).max(256),
    duration: yup.number().min(1).max(365),
    categoryId: yup.number().required().min(1),
    placeId: yup.number().required().min(1),
    tags: yup.array(yup.string().max(12)).max(5),
});

const CreateForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext);
    
    const [placeValue, setPlaceValue] = useState('');
    const [form, setForm] = useState<CampaignRequest>({
        kind: CampaignKind.SIGNATURES,
        goal: BigInt(0),
        state: [],
        title: '',
        target: '',
        body: '',
        cover: '',
        duration: 7,
        categoryId: 0,
        placeId: 0,
        tags: []
    });

    const validate = async (form: CampaignRequest): Promise<string[]> => {
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
            props.toggleLoading(true);

            const kind = Number(form.kind);

            await props.mutation.mutateAsync({
                main: actorState.main,
                req: {
                    kind: kind,
                    goal: kind === CampaignKind.DONATIONS?
                        decimalToIcp(form.goal.toString()):
                        BigInt(form.goal),
                    state: form.state,
                    title: form.title,
                    target: form.target,
                    body: form.body,
                    cover: form.cover,
                    duration: Number(form.duration),
                    categoryId: Number(form.categoryId),
                    placeId: Number(form.placeId),
                    tags: form.tags
                }
            });

            props.onSuccess('Campaign created!');
            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, actorState.main, props.onClose]);

    const changeForm = useCallback((e: any) => {
        setForm(form => ({
            ...form, 
            [e.target.name]: e.target.value
        }));
    }, []);

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
  
    return (
        <>
            <form onSubmit={handleCreate}>
                <SelectField 
                    label="Kind"
                    name="kind"
                    value={form.kind}
                    options={kindOptions}
                    required={true}
                    onChange={changeForm} 
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
                    label={`Goal ${Number(form.kind) === CampaignKind.DONATIONS? '(ICP)': (Number(form.kind) === CampaignKind.SIGNATURES? '(Signatures)': '(Votes)')}`}
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
                    value=""
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
                <Container>
                    {props.mutation.isError && 
                        <div className="form-error">
                            {props.mutation.error.message}
                        </div>
                    }
                </Container>
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button 
                            onClick={handleCreate} 
                            disabled={props.mutation.isLoading}
                        >
                            Create
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

export default CreateForm;