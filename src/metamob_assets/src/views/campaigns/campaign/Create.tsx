import React, {useState, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import Button from '../../../components/Button';
import TextField from "../../../components/TextField";
import SelectField, { Option } from "../../../components/SelectField";
import {Category, CampaignRequest, Place, Campaign, ProfileResponse, CampaignInfo, CampaignAction, FundingTier, FileRequest, Variant, MapEntry} from "../../../../../declarations/metamob/metamob.did";
import NumberField from "../../../components/NumberField";
import MarkdownField from "../../../components/MarkdownField";
import { ActorContext } from "../../../stores/actor";
import TagsField from "../../../components/TagsField";
import { search } from "../../../libs/places";
import AutocompleteField from "../../../components/AutocompleteField";
import { CampaignKind, campaignKindToGoal, CampaignResult, CampaignState, kindOptions } from "../../../libs/campaigns";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { useFindPlaceById } from "../../../hooks/places";
import Steps, { Step } from "../../../components/Steps";
import Item from "../Item";
import { AuthContext } from "../../../stores/auth";
import { setField } from "../../../libs/utils";
import { Tiers } from "./kinds/fundings/Tiers";
import { ModerationReason } from "../../../libs/moderations";
import { FormattedMessage } from "react-intl";
import { allowedFileTypes, MAX_FILE_SIZE } from "../../../libs/backend";
import FileDropArea from "../../../components/FileDropArea";
import ArrayField from "../../../components/ArrayField";
import VariantField from "../../../components/VariantField";
import { useUI } from "../../../hooks/ui";

interface Props {
    mutation: any;
    categories: Category[];
    place?: Place;
    onClose: () => void;
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
            signatures: {},
            votes: {pro: BigInt(0), against: BigInt(0)},
            donations: {},
        },
        goal: BigInt(0),
        total: BigInt(0),
        interactions: 0,
        updates: 0,
        action: {nop: null},
        moderated: ModerationReason.NONE,
        createdAt: now,
        createdBy: user?._id || 0,
        updatedAt: [],
        updatedBy: [],
        publishedAt: [now],
        expiredAt: [],
    }
};

const steps: Step[] = [
    {
        title: 'Title & Target',
        icon: 'heading',
    },
    {
        title: 'Message',
        icon: 'align-justify',
    },
    {
        title: 'Cover',
        icon: 'image',
    },
    {
        title: 'Kind',
        icon: 'shapes',
    },
    {
        title: 'Options',
        icon: 'list-ol',
    },
    {
        title: 'Preview',
        icon: 'check',
    },
];

const fundingSchema = yup.object().shape({
    tiers: yup.array(
        yup.object().shape({
            title: yup.string().min(3).max(256),
            desc: yup.string().min(10).max(1024),
            value: yup.string().required(),
            max: yup.number().required().min(1),
            total: yup.number().required().min(0).max(0),
        }).required()
    ).required().min(1).max(20)
}).required();

const transferActionSchema = yup.object().shape({
    receiver: yup.string().required().min(63).max(63)
});

const invokeActionSchema = yup.object().shape({
    canisterId: yup.string().test("is-defined", 'Invalid Canister Id', (val) => {
        if(!val) {
            return true;
        }
        return val.length === 27;
    }),
    method: yup.string().min(1).max(128),
    args: yup.array(yup.mixed()).required(),
});

const formSchema = [
    yup.object().shape({
        title: yup.string().min(10).max(128),
        target: yup.string().min(3).max(64),
    }),
    yup.object().shape({
        body: yup.string().min(100).max(4096),
    }),
    yup.object().shape({
        cover: yup.string().max(256),
    }),
    yup.object().shape({
        kind: yup.number().required(),
        info: yup.object().required().test('is-funding', 'Funding tiers invalid', (val) => {
            if('funding' in val) {
                try {
                    fundingSchema.validateSync(val.funding, {abortEarly: false});
                    return true;
                }
                catch(e: any) {
                    return e;
                }
            }

            return true;
        }),
    }),
    yup.object().shape({
        goal: yup.number().optional().default(0),
        duration: yup.number().min(1).max(365),
        categoryId: yup.number().required().min(1),
        placeId: yup.number().required().min(1),
        tags: yup.array(yup.string().max(12)).max(5),
        action: yup.object().required().test('is-action', 'Action invalid', (val) => {
            if('transfer' in val) {
                try {
                    transferActionSchema.validateSync(val.transfer, {abortEarly: false});
                    return true;
                }
                catch(e: any) {
                    return e;
                }
            }
            else if('invoke' in val) {
                try {
                    invokeActionSchema.validateSync(val.invoke, {abortEarly: false});
                    return true;
                }
                catch(e: any) {
                    return e;
                }
            }
            return true;   
        }),
    })
];

export const transformInfo = (
    info: CampaignInfo
): CampaignInfo => {
    if(!('funding' in info)) {
        return info;
    }

    const tiers: FundingTier[] = [];
    for(const tier of info.funding.tiers) {
        tiers.push({
            title: tier.title,
            desc: tier.desc,
            total: 0,
            max: Number(tier.max),
            value: typeof tier.value === 'string'? 
                decimalToIcp(tier.value): 
                tier.value
        });
    }

    return {
        funding: {
            tiers
        }
    };
};

const CreateForm = (props: Props) => {
    const [auth, ] = useContext(AuthContext);
    const [actors, ] = useContext(ActorContext);

    const {showSuccess, showError, toggleLoading} = useUI();
    
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
        tags: [],
        info: {signatures: {}},
        action: {nop: null},
    });
    const [files, setFiles] = useState<{cover: FileRequest}>({
        cover: {
            contentType: '',
            data: Buffer.from([])
        }
    })
    const [step, setStep] = useState(0);

    const place = useFindPlaceById(props.place?._id || 0);

    const validate = useCallback((
    ): string[] => {
        try {
            formSchema[step].validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    }, [form, step]);

    const handleCreate = useCallback(async (e: any) => {
        e.preventDefault();

        try {
            toggleLoading(true);

            const kind = Number(form.kind);

            await props.mutation.mutateAsync({
                main: actors.main,
                req: {
                    kind: kind,
                    goal: kind === CampaignKind.DONATIONS || kind === CampaignKind.FUNDINGS?
                        typeof form.goal === 'string'? 
                            decimalToIcp(form.goal):
                            form.goal:
                        BigInt(form.goal),
                    state: form.state,
                    title: form.title,
                    target: form.target,
                    body: form.body,
                    cover: form.cover,
                    duration: Number(form.duration),
                    categoryId: Number(form.categoryId),
                    placeId: Number(form.placeId),
                    tags: form.tags,
                    info: transformInfo(form.info),
                    action: form.action,
                },
                cover: !form.cover?
                    {
                        contentType: files.cover.contentType,
                        data: Array.from(files.cover.data) as any
                    }:
                    undefined
            });

            showSuccess('Campaign created!');
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, files, actors.main, props.onClose]);

    const changeForm = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => setField(form, field, value));
    }, []);

    const changeCover = useCallback((e: any) => {
        changeForm(e);
        setFiles(files => ({
            ...files,
            cover: {
                contentType: '',
                data: Buffer.from([])
            }
        }));
    }, []);

    const changeTiersItem = useCallback((field: string, value: any, index: number) => {
        setForm(form => {
            const tiers = 'funding' in form.info?
            Array.from(form.info.funding.tiers):
            [];

            (tiers[index] as any)[field] = value;

            return {
                ...form, 
                info: {
                    funding: {
                        tiers
                    }                
                }
            };
        });
    }, []);

    const changeTiers = useCallback((tiers: FundingTier[]) => {
        setForm(form => ({
            ...form,
            info: {
                funding: {
                    tiers
                }
            }
        }));
    }, []);

    const changeKind = useCallback((e: any, value: CampaignKind) => {
        e.preventDefault();

        let action: CampaignAction = {nop: null};
        let info: CampaignInfo = {signatures: {}};
        const receiver = auth.identity? 
            auth.identity.getPrincipal().toString(): 
            ''
        switch(Number(value)) {
            case CampaignKind.DONATIONS:
                action = {transfer: {receiver: receiver}};
                info = {donations: {}};
                break;
            case CampaignKind.FUNDINGS:
                action = {transfer: {receiver: receiver}};
                info = {funding: {tiers: []}};
                break;
            case CampaignKind.VOTES:
            case CampaignKind.WEIGHTED_VOTES:
                action = {invoke: {canisterId: '', method: '', args: [] as any}};
                info = {votes: {pro: BigInt(0), against: BigInt(0)}};
                break;
            default:
                break;
        }
    
        setForm(form => ({
            ...form, 
            kind: value,
            action: action,
            info: info,
        }));
    }, [auth.identity]);

    const handleSearchPlace = useCallback(async (
        value: string
    ): Promise<Option[]> => {
        try {
            return search(value);
        }
        catch(e) {
            showError(e);
            return [];
        }
    }, []);

    const handleFileSelected = useCallback(async (list: FileList, id?: string, name?: string) => {
        const field = id || name || '';
        
        if(list.length !== 1) {
            showError("Drag and drop only one file at time");
            return;
        }

        const file = list[0];
        if(file.size === 0) {
            showError("File can't be empty");
            return;
        }
        if(file.size > MAX_FILE_SIZE) {
            showError("File is too big. Max size: 1MB");
            return;
        }
        if(allowedFileTypes.indexOf(file.type) === -1) {
            showError("Invalid file type");
            return;
        }

        const data = await file.arrayBuffer();
        
        setFiles(files => ({
            ...files, 
            [field]: {
                contentType: file.type,
                data: Buffer.from(data)
            }
        }));

        setForm(form => ({
            ...form,
            cover: ''
        }));
    }, []);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    const handlePrev = useCallback((e: any) => {
        e.preventDefault();
        setStep(step => step > 0? step - 1: 0);
    }, []);
    
    const handleNext = useCallback((e: any) => {
        e.preventDefault();
        const errors = validate();
        if(errors.length > 0) {
            showError(errors);
            return;
        }
        setStep(step => step + 1);
    }, [validate]);

    const handleRenderArg = useCallback((
        entry: MapEntry, 
        index: number, 
        onChange?: (value: any, index: number) => void
    ) => {
        return (
            <>
                <TextField
                    label="Key"
                    value={entry.key}
                    required
                    onChange={onChange? 
                        (e) => onChange({key: e.target.value, value: entry.value}, index)
                    : 
                        undefined
                    }
                />
                <VariantField 
                    label="Value"
                    value={entry.value}
                    required
                    onChange={onChange? 
                        (e) => onChange({key: entry.key, value: e.target.value}, index)
                    : 
                        undefined
                    }
                />
            </>
        );
    }, []);

    const handleGenArg = useCallback((): MapEntry => {
        return {
            key: '', 
            value: {text: ''}
        };
    }, []);

    useEffect(() => {
        setForm(form => ({
            ...form,
            placeId: props.place?._id || 0
        }));
    }, [props.place]);

    const goalDisabled = (Number(form.kind) === CampaignKind.VOTES || Number(form.kind) === CampaignKind.WEIGHTED_VOTES) &&
        (place.data? 'dip20' in place.data.auth || 'dip721' in place.data.auth: false);

    return (
        <>
            <Steps
                step={step}
                steps={steps}
                size="small"
            />

            <form onSubmit={handleCreate}>
                {step === 0 &&
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
                {step === 1 &&
                    <MarkdownField
                        label="Body"
                        name="body"
                        value={form.body || ''}
                        rows={6}
                        onChange={changeForm}
                    />
                }
                {step === 2 &&
                    <>
                        <TextField 
                            label="Cover URL" 
                            name="cover"
                            value={form.cover || ''}
                            required={true}
                            onChange={changeCover}
                        />
                        <FileDropArea
                            label="Cover image"
                            name="cover"
                            onDrop={handleFileSelected} 
                        >
                            {!form.cover && files.cover.contentType &&
                                <div className="cover-preview">
                                    <img 
                                        src={`data:${files.cover.contentType};base64,` + Buffer.from(files.cover.data).toString('base64')} 
                                    />
                                </div>
                            }
                        </FileDropArea>
                    </>
                }
                {step === 3 &&
                    <>
                        <div className="kind-selector columns is-multiline">
                            {kindOptions.map((kind, index) =>
                                <div 
                                    key={index} 
                                    className="column is-4"
                                >
                                    <div 
                                        className={form.kind === kind.value? 'selected': ''}
                                        onClick={(e) => changeKind(e, kind.value)}
                                    >
                                        <div><i className={`la la-${kind.icon}`} /></div>
                                        <div>{kind.name}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {Number(form.kind) === CampaignKind.FUNDINGS &&
                            <>
                                <Tiers
                                    info={form.info}
                                    onChange={changeTiers}
                                    onChangeItem={changeTiersItem}
                                />
                            </>
                        }
                    </>
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
                        {!goalDisabled?
                            <TextField 
                                label={campaignKindToGoal(form.kind)}
                                name="goal"
                                value={typeof form.goal === 'string'? form.goal: icpToDecimal(form.goal)}
                                required={true}
                                onChange={changeForm}
                            />
                        :
                            <TextField 
                                label={campaignKindToGoal(form.kind)}
                                value="50% + 1"
                                disabled
                            />
                        }
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
                        {(Number(form.kind) === CampaignKind.DONATIONS || Number(form.kind) === CampaignKind.FUNDINGS) &&
                            <>
                                <label className="label"><FormattedMessage defaultMessage="Action (transfer funds)"/></label>
                                <div className="p-2 border">
                                    <TextField 
                                        label="To account" 
                                        name="action.transfer.receiver"
                                        value={'transfer' in form.action? 
                                            form.action.transfer.receiver || '':
                                            ''}
                                        required={true}
                                        onChange={changeForm}
                                    />
                                </div>
                            </>
                        }
                        {(Number(form.kind) === CampaignKind.VOTES || Number(form.kind) === CampaignKind.WEIGHTED_VOTES) &&
                            <>
                                <label className="label"><FormattedMessage defaultMessage="Action (invoke method)"/></label>
                                {'invoke' in form.action && 
                                    <div className="p-2 border">
                                        <TextField 
                                            label="Canister Id" 
                                            name="action.invoke.canisterId"
                                            value={form.action.invoke.canisterId || ''}
                                            onChange={changeForm}
                                        />
                                        <TextField 
                                            label="Method name" 
                                            name="action.invoke.method"
                                            value={form.action.invoke.method || ''}
                                            onChange={changeForm}
                                        />
                                        <ArrayField
                                            label="Arguments" 
                                            name="action.invoke.args"
                                            value={form.action.invoke.args}
                                            onChange={changeForm}
                                            onRenderItem={handleRenderArg}
                                            onGetEmptyItem={handleGenArg}
                                        />
                                    </div>
                                }
                            </>
                        }
                    </>
                }
                {step !== 5 &&
                    <div className="field is-grouped mt-5">
                        <div className="control">
                            <Button 
                                onClick={handlePrev} 
                                disabled={step === 0}
                            >
                                <FormattedMessage id="Prev" defaultMessage="Prev"/>
                            </Button>
                        </div>
                        <div className="control">
                            <Button 
                                onClick={handleNext} 
                            >
                                <FormattedMessage id="Next" defaultMessage="Next" />
                            </Button>
                        </div>
                        <div className="control">
                            <Button 
                                color="danger"
                                onClick={handleClose} 
                            >
                                <FormattedMessage id="Cancel" defaultMessage="Cancel" />
                            </Button>
                        </div>
                    </div>
                }                
                {step === 5 &&
                    <div>
                        <Item
                            campaign={toCampaign(form, auth.user)}
                            cover={files.cover}
                            isPreview
                        />
                        <div className="field is-grouped mt-5">
                            <div className="control">
                                <Button 
                                    onClick={handlePrev} 
                                >
                                    <FormattedMessage id="Prev" defaultMessage="Prev"/>
                                </Button>
                            </div>
                            <div className="control">
                                <Button 
                                    onClick={handleCreate} 
                                    disabled={props.mutation.isLoading}
                                >
                                    <FormattedMessage id="Create" defaultMessage="Create" />
                                </Button>
                            </div>
                            <div className="control">
                                <Button 
                                    color="danger"
                                    onClick={handleClose} 
                                >
                                    <FormattedMessage id="Cancel" defaultMessage="Cancel" />
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
