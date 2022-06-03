import React, {useState, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import Button from '../../../components/Button';
import TextField from "../../../components/TextField";
import SelectField, { Option } from "../../../components/SelectField";
import Container from "../../../components/Container";
import {Category, CampaignRequest, Place, Campaign, ProfileResponse, CampaignInfo} from "../../../../../declarations/dchanges/dchanges.did";
import NumberField from "../../../components/NumberField";
import MarkdownField from "../../../components/MarkdownField";
import { ActorContext } from "../../../stores/actor";
import TagsField from "../../../components/TagsField";
import { search } from "../../../libs/places";
import AutocompleteField from "../../../components/AutocompleteField";
import { CampaignKind, CampaignResult, CampaignState, kindOptions } from "../../../libs/campaigns";
import { decimalToIcp } from "../../../libs/icp";
import { useFindPlaceById } from "../../../hooks/places";
import Steps, { Step } from "../../../components/Steps";
import Item from "../Item";
import { AuthContext } from "../../../stores/auth";

interface Props {
    mutation: any;
    categories: Category[];
    place?: Place;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const toCampaign = (
    form: CampaignRequest,
    user?: ProfileResponse
): Campaign => {
    const now = BigInt(Date.now()) * BigInt(1000000);
    return {
        ...form,
        categoryId: Number(form.categoryId),
        placeId: Number(form.placeId),
        _id: 0,
        pubId: 'new',
        boosting: BigInt(0),
        result: CampaignResult.NONE,
        state: CampaignState.CREATED,
        info: {
            signatures: {goal: 0},
            votes: {pro: 0, against: 0, goal: 0},
            anonVotes: {pro: 0, against: 0, goal: 0},
            weightedVotes: {pro: BigInt(0), against: BigInt(0), goal: BigInt(0)},
            donations: {goal: BigInt(0)}
        },
        total: BigInt(0),
        updatesCnt: 0,
        createdAt: now,
        createdBy: user?._id || 0,
        updatedAt: [],
        updatedBy: [],
        publishedAt: [now],
        deletedAt: [],
        deletedBy: [],
        expiredAt: [],
    }
};

const steps: Step[] = [
    {
        title: 'Kind',
        icon: 'shapes',
    },
    {
        title: 'Title & Target',
        icon: 'heading',
    },
    {
        title: 'Body',
        icon: 'align-justify',
    },
    {
        title: 'Cover',
        icon: 'image',
    },
    {
        title: 'Duration & Goal',
        icon: 'clock',
    },
    {
        title: 'Category & Place',
        icon: 'list-ol',
    },
    {
        title: 'Preview',
        icon: 'check',
    },
];

const formSchema = [
    yup.object().shape({
        kind: yup.number().required(),
    }),
    yup.object().shape({
        title: yup.string().min(10).max(128),
        target: yup.string().min(3).max(64),
    }),
    yup.object().shape({
        body: yup.string().min(100).max(4096),
    }),
    yup.object().shape({
        cover: yup.string().min(7).max(256),
    }),
    yup.object().shape({
        goal: yup.number().required().min(1),
        duration: yup.number().min(1).max(365),
    }),
    yup.object().shape({
        categoryId: yup.number().required().min(1),
        placeId: yup.number().required().min(1),
        tags: yup.array(yup.string().max(12)).max(5),
    })
];

const CreateForm = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [actorState, ] = useContext(ActorContext);
    
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
        placeId: props.place?._id || 0,
        tags: []
    });
    const [step, setStep] = useState(0);

    const place = useFindPlaceById(props.place?._id || 0);

    const validate = useCallback(async (
    ): Promise<string[]> => {
        try {
            await formSchema[step].validate(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    }, [form, step]);

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();

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

    const handlePrev = useCallback(async (e: any) => {
        e.preventDefault();
        setStep(step => step > 0? step - 1: 0);
    }, []);
    
    const handleNext = useCallback(async (e: any) => {
        e.preventDefault();
        const errors = await validate();
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }
        setStep(step => step + 1);
    }, [validate]);

    useEffect(() => {
        setForm(form => ({
            ...form,
            placeId: props.place?._id || 0
        }));
    }, [props.place]);
    
    return (
        <>
            <Steps
                step={step}
                steps={steps}
                size="small"
            />

            <form onSubmit={handleCreate}>
                {step === 0 &&
                    <SelectField 
                        label="Kind"
                        name="kind"
                        value={form.kind}
                        options={kindOptions}
                        required={true}
                        onChange={changeForm} 
                    />
                }
                {step === 1 &&
                    <>
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
                    </>
                }
                {step === 2 &&
                    <MarkdownField
                        label="Body"
                        name="body"
                        value={form.body || ''}
                        rows={6}
                        onChange={changeForm}
                    />
                }
                {step === 3 &&
                    <TextField 
                        label="Cover image" 
                        name="cover"
                        value={form.cover || ''}
                        required={true}
                        onChange={changeForm}
                    />
                }
                {step === 4 &&
                    <>
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
                    </>
                }
                {step === 5 &&
                    <>
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
                            disabled={!!props.place}
                            onSearch={handleSearchPlace}
                            onChange={changeForm}
                        />
                        <TagsField 
                            label="Tags"
                            name="tags"
                            value={form.tags}
                            maxTags={5}
                            onChange={changeForm} 
                        />
                    </>
                }
                <Container>
                    {props.mutation.isError && 
                        <div className="form-error">
                            {props.mutation.error.message}
                        </div>
                    }
                </Container>
                {step !== 6 &&
                    <div className="field is-grouped mt-5">
                        <div className="control">
                            <Button 
                                onClick={handlePrev} 
                                disabled={step === 0}
                            >
                                Prev
                            </Button>
                        </div>
                        <div className="control">
                            <Button 
                                onClick={handleNext} 
                            >
                                Next
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
                }                
                {step === 6 &&
                    <div>
                        <Item
                            campaign={toCampaign(form, authState.user)}
                            isPreview
                        />
                        <div className="field is-grouped mt-5">
                            <div className="control">
                                <Button 
                                    onClick={handlePrev} 
                                >
                                    Prev
                                </Button>
                            </div>
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
                    </div>                
                }
            </form>
        </>
    );
};

export default CreateForm;