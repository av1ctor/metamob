import React, {useState, useCallback, useEffect} from "react";
import * as yup from 'yup';
import {useCreatePoap, useModeratePoap, useUpdatePoap} from "../../../hooks/poap";
import {Poap, PoapRequest} from "../../../../../declarations/metamob/metamob.did";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import TextField from "../../../components/TextField";
import { isModerator } from "../../../libs/users";
import CreateModerationForm, { transformModerationForm, useModerationForm, useSetModerationFormField, validateModerationForm } from "../../moderations/moderation/Create";
import { FormattedMessage, useIntl } from "react-intl";
import FileDropArea from "../../../components/FileDropArea";
import NumberField from "../../../components/NumberField";
import { LEDGER_TRANSFER_FEE } from "../../../libs/backend";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { getConfigAsNat64 } from "../../../libs/dao";
import { formatPoapBody, POAP_DEPLOYING_PRICE } from "../../../libs/poap";
import { useUI } from "../../../hooks/ui";
import { useAuth } from "../../../hooks/auth";
import { useWallet } from "../../../hooks/wallet";

interface Props {
    campaignId: number,
    poap?: Poap;
    reportId?: number | null;
    onClose: () => void;
};

const formSchema = yup.object().shape({
    campaignId: yup.number().required(),
    logo: yup.string().required().min(6).max(16384),
    name: yup.string().required().min(3).max(64),
    symbol: yup.string().required().min(3).max(8),
    width: yup.number().required().min(50).max(4096),
    height: yup.number().required().min(50).max(4096),
    price: yup.number().required().min(1_00000000),
    maxSupply: yup.number().optional(),
    body: yup.string().required().min(6).max(16384),
    options: yup.number().required(),
});

const loadForm = (campaignId: number, poap?: Poap): PoapRequest => {
    return (poap?
        {
            campaignId: campaignId,
            logo: poap.logo,
            name: poap.name,
            symbol: poap.symbol,
            width: poap.width,
            height: poap.height,
            price: poap.price,
            maxSupply: poap.maxSupply,
            body: poap.body,
            options: poap.options,
        }:
        {
            campaignId: campaignId,
            logo: '',
            name: '',
            symbol: '',
            width: 350,
            height: 350,
            price: BigInt(10_00000000),
            maxSupply: [1000],
            body: '',
            options: 0,
        }
    );
};

const EditForm = (props: Props) => {
    const {user} = useAuth();
    const {balances, depositICP} = useWallet();
    const intl = useIntl();

    const {showSuccess, showError, toggleLoading} = useUI();
    
    const [form, setForm] = useState<PoapRequest>(() => loadForm(props.campaignId, props.poap));
    const [poapDeployingPrice, setPoapDeployingPrice] = useState(POAP_DEPLOYING_PRICE);

    const [modForm, setModForm] = useModerationForm(props.reportId);
    
    const createMut = useCreatePoap();
    const updateMut = useUpdatePoap();
    const moderateMut = useModeratePoap();

    const fees = LEDGER_TRANSFER_FEE * BigInt(2);

    const changeForm = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field.replace('__edit__', '')]: value
        }));
    }, []);

    const changeFormOpt = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = e.target.type === 'checkbox'?
            e.target.checked:
            e.target.value;
        setForm(form => ({
            ...form, 
            [field]: [value]
        }));
    }, []);

    const changeFormICP = useCallback((e: any) => {
        const field = e.target.id || e.target.name;
        const value = decimalToIcp(e.target.value);
        setForm(form => ({
            ...form, 
            [field]: value
        }));
    }, []);

    const handleDrop = useCallback(async (files: FileList, id?: string, name?: string) => {
        const field = id || name || '';
        
        if(files.length !== 1) {
            showError("Drag and drop only one file at time");
            return;
        }

        const file = files[0];
        if(file.size > 16384) {
            showError("File is too big. Max size: 16KB");
            return;
        }
        if(file.type !== 'image/svg+xml') {
            showError("Only SVG images are supported");
            return;
        }
        
        let value = await file.text();

        if(field === 'body') {
            const parser = new DOMParser();
            const svg = parser.parseFromString(value, 'text/xml');
            value = svg.getElementsByTagName('svg')[0].innerHTML;
        }

        setForm(form => ({
            ...form, 
            [field]: value
        }));
    }, []);

    const changeModForm = useSetModerationFormField(setModForm);

    const validate = (form: PoapRequest): string[] => {
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

        const errors = validate(form);
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

        const transformReq = (): PoapRequest => {
            return {
                campaignId: props.campaignId,
                name: form.name,
                symbol: form.symbol,
                logo: form.logo,
                width: Number(form.width),
                height: Number(form.height),
                price: BigInt(form.price),
                maxSupply: form.maxSupply.length > 0 && Number(form.maxSupply[0]) > 0? 
                    [Number(form.maxSupply[0])]: 
                    [],
                body: form.body,
                options: Number(form.options),
            };
        };
        
        try {
            toggleLoading(true);

            if(isModeration) {
                if(props.poap) {
                    await moderateMut.mutateAsync({
                        pubId: props.poap.pubId, 
                        req: transformReq(),
                        mod: transformModerationForm(modForm)
                    });
                    showSuccess(intl.formatMessage({defaultMessage: 'Poap moderated!'}));
                }
            }
            else {
                if(!props.poap) {
                    if(poapDeployingPrice + fees >= balances.icp) {
                        throw Error(`Insufficient funds! Needed: ${icpToDecimal(poapDeployingPrice + fees)} ICP.`)
                    }

                    await depositICP(poapDeployingPrice + fees);
                    
                    try {
                        await createMut.mutateAsync({
                            req: transformReq(),
                        });
                        showSuccess(intl.formatMessage({defaultMessage: 'Poap created!'}));
                    }
                    catch(e) {
                        throw e;
                    }
                }
                else {
                    await updateMut.mutateAsync({
                        pubId: props.poap.pubId, 
                        req: transformReq(),
                    });
                    showSuccess(intl.formatMessage({defaultMessage: 'Poap updated!'}));
                }
            }

            props.onClose();
        }
        catch(e) {
            showError(e);
        }
        finally {
            toggleLoading(false);
        }
    }, [form, modForm, props.poap, balances, poapDeployingPrice, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    useEffect(() => {
        setForm(loadForm(props.campaignId, props.poap));
    }, [props.poap]);

    useEffect(() => {
        (async () => {
            const price = await getConfigAsNat64("POAP_DEPLOYING_PRICE");
            setPoapDeployingPrice(price);
        })();
    }, []);

    return (
        <form onSubmit={handleUpdate}>
            <Container>
                {props.poap && 
                    <TextField
                        label="Canister Id"
                        value={props.poap.canisterId}
                        disabled
                    />
                }
                <TextField
                    label="Name"
                    name="name"
                    value={form.name || ''}
                    required
                    onChange={changeForm} 
                />
                <TextField
                    label="Symbol"
                    name="symbol"
                    value={form.symbol || ''}
                    required
                    onChange={changeForm} 
                />
                <FileDropArea
                    label="Logo"
                    name="logo"
                    accept=".svg,image/svg+xml"
                    onDrop={handleDrop} 
                >
                    {form.logo && 
                        <div className="poap-logo">
                            <img 
                                className="full" 
                                src={"data:image/svg+xml;utf8," + encodeURIComponent(form.logo)} 
                            />
                        </div>
                    }
                </FileDropArea>
                <TextField
                    label="Price (ICP)"
                    name="price"
                    value={icpToDecimal(form.price)}
                    required
                    onChange={changeFormICP} 
                />
                <NumberField
                    label="Max supply"
                    name="maxSupply"
                    value={form.maxSupply[0] || 0}
                    required
                    onChange={changeFormOpt} 
                />
                <NumberField
                    label="Width"
                    name="width"
                    value={form.width}
                    required
                    onChange={changeForm} 
                />
                <NumberField
                    label="Height"
                    name="height"
                    value={form.height}
                    required
                    onChange={changeForm} 
                />
                <FileDropArea
                    label="Body"
                    name="body"
                    accept=".svg,image/svg+xml"
                    onDrop={handleDrop} 
                >
                    {form.body && 
                        <div className="poap-body">
                            <img 
                                className="full"
                                src={"data:image/svg+xml;utf8," + encodeURIComponent(formatPoapBody(form.body, form.width, form.height))}
                                width={form.width || 50}
                                height={form.height || 50}
                            />
                        </div>
                    }
                </FileDropArea>
                {props.reportId && isModerator(user) &&
                    <CreateModerationForm
                        form={modForm}
                        onChange={changeModForm}
                    />
                }
                {!props.poap &&
                    <div className="warning-box">
                        <FormattedMessage defaultMessage="A total of {value} ICP will be billed from your wallet!" values={{value: icpToDecimal(poapDeployingPrice + fees)}} />
                    </div>
                }
                <div className="field is-grouped mt-2">
                    <div className="control">
                        <Button
                            onClick={handleUpdate}
                            disabled={updateMut.isLoading}
                        >
                            {props.poap? 
                                <FormattedMessage id="Update" defaultMessage="Update"/>
                            :
                                <FormattedMessage id="Create" defaultMessage="Create"/>
                            }
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
            </Container>
        </form>
    );
};

export default EditForm;
