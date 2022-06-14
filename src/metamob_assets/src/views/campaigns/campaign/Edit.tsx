import React, {useState, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import {useUpdateCampaign} from "../../../hooks/campaigns";
import {Category, Campaign, CampaignRequest, FundingTier, CampaignInfo} from "../../../../../declarations/metamob/metamob.did";
import TextField from "../../../components/TextField";
import SelectField, { Option } from "../../../components/SelectField";
import Button from "../../../components/Button";
import NumberField from "../../../components/NumberField";
import MarkdownField from "../../../components/MarkdownField";
import { ActorContext } from "../../../stores/actor";
import TagsField from "../../../components/TagsField";
import { useFindPlaceById } from "../../../hooks/places";
import { search } from "../../../libs/places";
import AutocompleteField from "../../../components/AutocompleteField";
import { AuthContext } from "../../../stores/auth";
import { isModerator } from "../../../libs/users";
import { CampaignKind, campaignKindToGoal, kindOptions, stateOptions } from "../../../libs/campaigns";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { setField } from "../../../libs/utils";
import { Tiers } from "./kinds/fundings/Tiers";
import { transformInfo } from "./Create";

interface Props {
    campaign: Campaign;
    categories: Category[];
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

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
        return val.length === 58;
    }),
    method: yup.string().optional().max(128),
    args: yup.array(yup.number()).optional(),
});

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
                invokeActionSchema.validateSync(val.invoke, {abortEarly: false});
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

const EditForm = (props: Props) => {
    const [actorState, ] = useContext(ActorContext)
    const [authState, ] = useContext(AuthContext);
    
    const [form, setForm] = useState<CampaignRequest>({
        ...props.campaign,
        state: [props.campaign.state],
        info: cloneInfo(props.campaign.info),
    });
    
    const updateMut = useUpdateCampaign();
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
            props.onError(errors);
            return;
        }

        try {
            props.toggleLoading(true);

            const kind = Number(formt.kind);

            await updateMut.mutateAsync({
                main: actorState.main,
                pubId: props.campaign.pubId, 
                req: {
                    kind: kind,
                    goal: kind === CampaignKind.DONATIONS || kind === CampaignKind.FUNDINGS?
                        typeof formt.goal === 'string'? 
                            decimalToIcp(formt.goal):
                            formt.goal:    
                        BigInt(formt.goal),
                    state: isModerator(authState.user) && formt.state.length > 0? 
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
                    action: formt.action,
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
    
    useEffect(() => {
        setForm({
            ...props.campaign,
            state: [props.campaign.state],
            info: cloneInfo(props.campaign.info),
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
                <TextField 
                    label={campaignKindToGoal(form.kind)}
                    name="goal"
                    value={typeof form.goal === 'string'? form.goal: icpToDecimal(form.goal)}
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
                        <label className="label">Action (transfer funds)</label>
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
                        <label className="label">Action (invoke method)</label>
                        <div className="p-2 border">
                            <TextField 
                                label="Canister Id" 
                                name="action.invoke.canisterId"
                                value={'invoke' in form.action? 
                                    form.action.invoke.canisterId || '':
                                    ''}
                                onChange={changeForm}
                            />
                            <TextField 
                                label="Method name" 
                                name="action.invoke.method"
                                value={'invoke' in form.action? 
                                    form.action.invoke.method || '':
                                    ''}
                                onChange={changeForm}
                            />
                            <TextField 
                                label="Arguments" 
                                name="action.invoke.args"
                                value={'invoke' in form.action? 
                                    form.action.invoke.args.toString() || '':
                                    ''}
                                onChange={changeForm}
                            />
                        </div>
                    </>
                }
                {authState.user && isModerator(authState.user) &&
                    <SelectField
                        label="State"
                        name="state"
                        value={form.state.length > 0 ? form.state[0] || 0: 0}
                        options={stateOptions}
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
        </>
    );
};

export default EditForm;