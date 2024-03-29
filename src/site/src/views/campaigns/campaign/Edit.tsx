import React, {useState, useCallback, useEffect} from "react";
import * as yup from 'yup';
import {useModerateCampaign, useUpdateCampaign} from "../../../hooks/campaigns";
import {Category, Campaign, CampaignRequest, FundingTier, CampaignInfo, FileRequest, MapEntry, CampaignInvokeMethodAction, Place} from "../../../../../declarations/metamob/metamob.did";
import TextField from "../../../components/TextField";
import SelectField, { Option } from "../../../components/SelectField";
import Button from "../../../components/Button";
import NumberField from "../../../components/NumberField";
import MarkdownField from "../../../components/MarkdownField";
import TagsField from "../../../components/TagsField";
import { useFindPlaceById } from "../../../hooks/places";
import { search } from "../../../libs/places";
import AutocompleteField from "../../../components/AutocompleteField";
import { isModerator } from "../../../libs/users";
import { CampaignKind, campaignKindToGoal, kindOptions, stateOptions } from "../../../libs/campaigns";
import { decimalToE8s, e8sToDecimal } from "../../../libs/icp";
import { e2sToDecimal, setField } from "../../../libs/utils";
import { Tiers } from "./kinds/fundings/Tiers";
import { transformInfo } from "./Create";
import CreateModerationForm, { transformModerationForm, useModerationForm, useSetModerationFormField, validateModerationForm } from "../../moderations/moderation/Create";
import { FormattedMessage, useIntl } from "react-intl";
import { allowedFileTypes, MAX_FILE_SIZE } from "../../../libs/backend";
import FileDropArea from "../../../components/FileDropArea";
import VariantField from "../../../components/VariantField";
import ArrayField from "../../../components/ArrayField";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";
import { useActors } from "../../../hooks/actors";

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
    method: yup.string().optional().max(128),
    args: yup.array(yup.mixed()).optional(),
});

const formSchema = yup.object().shape({
    kind: yup.number().required(),
    goal: yup.number().optional().default(0),
    state: yup.array(yup.number().min(1)).required(),
    title: yup.string().min(10).max(128),
    target: yup.string().min(3).max(64),
    body: yup.string().min(100).max(4096),
    cover: yup.string().max(256),
    duration: yup.number().min(1).max(365),
    categoryId: yup.number().required().min(1),
    placeId: yup.number().required().min(1),
    tags: yup.array(yup.string().max(12)).max(5),
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
                const invoke = val.invoke as CampaignInvokeMethodAction;
                if(invoke.canisterId) {
                    invokeActionSchema.validateSync(invoke, {abortEarly: false});
                }
                return true;
            }
            catch(e: any) {
                return e;
            }
        }
        return true;   
    }),
});

const cloneInfo = (info: CampaignInfo): CampaignInfo => {
    if('signatures' in info) {
        return {signatures: {}};
    }
    else if('donations' in info) {
        return {donations: {}};
    }
    else if('votes' in info) {
        return {votes: {
            pro: info.votes.pro,
            against: info.votes.against
        }};
    }
    else if('funding' in info) {
        return {funding: {
            tiers: info.funding.tiers.map(tier => ({
                title: tier.title,
                desc: tier.desc,
                currency: tier.currency,
                value: tier.value,
                max: tier.max,
                total: tier.total
            }))
        }};
    }
    else {
        throw Error('Unknown kind');
    }
};

interface Props {
    campaign: Campaign;
    categories: Category[];
    place?: Place;
    reportId?: number | null;
    onClose: () => void;
};

const EditForm = (props: Props) => {
    const {metamob} = useActors();
    const {user} = useAuth();
    const intl = useIntl();

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState<CampaignRequest>({
        ...props.campaign,
        state: [props.campaign.state],
        info: cloneInfo(props.campaign.info),
    });
    const [files, setFiles] = useState<{cover: FileRequest}>({
        cover: {
            contentType: '',
            data: Buffer.from([])
        }
    });
    const [modForm, setModForm] = useModerationForm(props.reportId);
    
    const updateMut = useUpdateCampaign();
    const moderateMut = useModerateCampaign();
    
    const place = useFindPlaceById(props.campaign.placeId);
    
    const changeForm = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => setField(form, field, value));
    }, []);

    const changeFormOpt = useCallback((e: any) => {
        const field = (e.target.id || e.target.name);
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => setField(form, field, [value]));
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

    const changeModForm = useSetModerationFormField(setModForm);

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

    const validate = (form: any): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleUpdate = useCallback(async (e: any) => {
        e.preventDefault();

        const formt = {
            ...form,
            info: transformInfo(form.info)
        };

        const errors = validate(formt);
        if(errors.length > 0) {
            showError(errors);
            return;
        }

        const isModeration = props.reportId && isModerator(user);

        if(isModeration) {
            const errors = validateModerationForm(modForm);
            if(errors.length > 0) {
                showError(errors);
                return;
            }
        }

        const transformReq = (): CampaignRequest => {
            const kind = Number(formt.kind);

            return {
                kind: kind,
                goal: kind === CampaignKind.DONATIONS || kind === CampaignKind.FUNDINGS?
                    typeof formt.goal === 'string'? 
                        decimalToE8s(formt.goal):
                        formt.goal:    
                    BigInt(formt.goal),
                state: isModerator(user) && formt.state.length > 0? 
                    [Number(formt.state[0])]: 
                    [],
                categoryId: Number(formt.categoryId),
                placeId: Number(formt.placeId),
                title: formt.title,
                target: formt.target,
                body: formt.body,
                cover: formt.cover,
                duration: Number(formt.duration),
                tags: formt.tags,
                info: formt.info,
                action: 'invoke' in form.action?
                        !form.action.invoke.canisterId?
                            {nop: null}
                        :
                        form.action
                    :
                        form.action,
            };
        };

        try {
            toggleLoading(true);

            if(isModeration) {
                await moderateMut.mutateAsync({
                    pubId: props.campaign.pubId, 
                    req: transformReq(),
                    mod: transformModerationForm(modForm),
                    cover: !form.cover?
                    {
                        contentType: files.cover.contentType,
                        data: Array.from(files.cover.data) as any
                    }:
                    undefined
                });
    
                showSuccess(intl.formatMessage({defaultMessage: 'Campaign moderated!'}));
            }
            else {
                await updateMut.mutateAsync({
                    pubId: props.campaign.pubId, 
                    req: transformReq(),
                    cover: !form.cover?
                        {
                            contentType: files.cover.contentType,
                            data: Array.from(files.cover.data) as any
                        }:
                        undefined
                });
    
                showSuccess(intl.formatMessage({defaultMessage: 'Campaign updated!'}));
            }
            
            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, files, modForm, props.onClose]);

    const handleSearchPlace = useCallback(async (
        value: string
    ): Promise<Option[]> => {
        try {
            return search(value, metamob);
        }
        catch(e) {
            showError(e);
            return [];
        }
    }, []);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

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
        setForm({
            ...props.campaign,
            state: [props.campaign.state],
            info: cloneInfo(props.campaign.info),
        });
    }, [props.campaign]);

    const goalDisabled = (Number(form.kind) === CampaignKind.VOTES || Number(form.kind) === CampaignKind.WEIGHTED_VOTES) &&
        (place.data && place.data.auth? 'dip20' in place.data.auth || 'dip721' in place.data.auth: false);

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
                    value={form.title}
                    required={true}
                    onChange={changeForm}
                />
                <TextField 
                    label="Target" 
                    name="target"
                    value={form.target}
                    required={true}
                    onChange={changeForm}
                />
                <MarkdownField
                    label="Body"
                    name="body"
                    value={form.body}
                    rows={6}
                    onChange={changeForm}
                />
                <TextField 
                    label="Cover URL" 
                    name="cover"
                    value={form.cover}
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
                
                {Number(form.kind) === CampaignKind.FUNDINGS &&
                    <>
                        <Tiers
                            info={form.info}
                            disabled={props.campaign.total > 0}
                            onChange={changeTiers}
                            onChangeItem={changeTiersItem}
                        />
                    </>
                }
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
                        value={typeof form.goal === 'string'? 
                            form.goal: 
                            Number(form.kind) === CampaignKind.DONATIONS || Number(form.kind) === CampaignKind.FUNDINGS?
                                e8sToDecimal(form.goal):
                                form.goal.toString()
                        }
                        required={true}
                        onChange={changeForm}
                    />
                :
                    <TextField 
                        label={campaignKindToGoal(form.kind)}
                        value={`${props.place?.auth && 'dip20' in props.place.auth? e2sToDecimal(props.place.auth.dip20.minVotesPerc): '50'}% + 1`}
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
                {user && isModerator(user) &&
                    <SelectField
                        label="State"
                        name="state"
                        value={form.state.length > 0 ? form.state[0] || 0: 0}
                        options={stateOptions}
                        onChange={changeFormOpt}
                    />                    
                }
                {props.reportId && isModerator(user) &&
                    <CreateModerationForm
                        form={modForm}
                        onChange={changeModForm}
                    />
                }
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleUpdate}
                            disabled={updateMut.isLoading}
                        >
                            <FormattedMessage id="Update" defaultMessage="Update"/>
                        </Button>
                    </div>
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={handleClose}
                        >
                            <FormattedMessage id="Cancel" defaultMessage="Cancel"/>
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
};

export default EditForm;