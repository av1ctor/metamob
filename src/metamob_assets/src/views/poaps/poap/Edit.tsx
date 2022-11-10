import React, {useState, useCallback, useContext, useEffect} from "react";
import * as yup from 'yup';
import {useCreatePoap, useModeratePoap, useUpdatePoap} from "../../../hooks/poap";
import {Poap, PoapRequest} from "../../../../../declarations/metamob/metamob.did";
import {idlFactory as Ledger} from "../../../../../declarations/ledger";
import Container from "../../../components/Container";
import Button from "../../../components/Button";
import { ActorActionType, ActorContext } from "../../../stores/actor";
import TextField from "../../../components/TextField";
import { depositIcp, getIcpBalance, isModerator } from "../../../libs/users";
import { AuthContext } from "../../../stores/auth";
import CreateModerationForm, { transformModerationForm, useModerationForm, useSetModerationFormField, validateModerationForm } from "../../moderations/moderation/Create";
import { FormattedMessage, useIntl } from "react-intl";
import FileDropArea from "../../../components/FileDropArea";
import NumberField from "../../../components/NumberField";
import { createLedgerActor, LEDGER_TRANSFER_FEE } from "../../../libs/backend";
import { Identity } from "@dfinity/agent";
import { decimalToIcp, icpToDecimal } from "../../../libs/icp";
import { getConfigAsNat64 } from "../../../libs/dao";
import { formatPoapBody, POAP_DEPLOYING_PRICE } from "../../../libs/poap";

interface Props {
    campaignId: number,
    poap?: Poap;
    reportId?: number | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    campaignId: yup.number().required(),
    logo: yup.string().required().min(6).max(16384),
    name: yup.string().required().min(3).max(64),
    symbol: yup.string().required().min(3).max(8),
    width: yup.number().required().min(50).max(4096),
    height: yup.number().required().min(50).max(4096),
    price: yup.number().required().min(1),
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
    const [actors, actorsDispatch] = useContext(ActorContext);
    const [auth, ] = useContext(AuthContext);
    const intl = useIntl();
    
    const [form, setForm] = useState<PoapRequest>(() => loadForm(props.campaignId, props.poap));
    const [balance, setBalance] = useState(BigInt(0));
    const [poapDeployingPrice, setPoapDeployingPrice] = useState(POAP_DEPLOYING_PRICE);

    const [modForm, setModForm] = useModerationForm(props.reportId);
    
    const createMut = useCreatePoap();
    const updateMut = useUpdatePoap();
    const moderateMut = useModeratePoap();

    const fees = LEDGER_TRANSFER_FEE * BigInt(2);

    const getLedgerCanister = async (
    ): Promise<Ledger | undefined> => {
        if(actors.ledger) {
            return actors.ledger;
        }
        
        if(!auth.identity) {
            return undefined;
        }

        const ledger = createLedgerActor(auth.identity);
        actorsDispatch({
            type: ActorActionType.SET_LEDGER,
            payload: ledger
        });

        return ledger;
    };

    const checkUserBalance = async (
        identity: Identity, 
        ledger: Ledger
    ) => {
        const balance = await getIcpBalance(identity, ledger);
        setBalance(balance);
    };

    const updateState = useCallback(async(
    ) => {
        const ledger = await getLedgerCanister();
        if(!ledger) {
            return;
        }

        const identity = auth.identity;
        if(!identity) {
            return;
        }

        checkUserBalance(identity, ledger);
    }, [auth.identity]);

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
            props.onError("Drag and drop only one file at time");
            return;
        }

        const file = files[0];
        if(file.size > 16384) {
            props.onError("File is too big");
            return;
        }
        if(file.type !== 'image/svg+xml') {
            props.onError("Only SVG images are supported");
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
            props.onError(errors);
            return;
        }

        const isModeration = props.reportId && isModerator(auth.user);

        if(isModeration) {
            const errors = validateModerationForm(modForm);
            if(errors.length > 0) {
                props.onError(errors);
                return;
            }
        }

        const transformReq = (): PoapRequest => {
            return {
                campaignId: props.campaignId,
                name: form.name,
                symbol: form.symbol,
                logo: form.logo,
                width: form.width,
                height: form.height,
                price: form.price,
                maxSupply: form.maxSupply.length > 0? [Number(form.maxSupply[0])]: [],
                body: form.body,
                options: form.options,
            };
        };
        
        try {
            props.toggleLoading(true);

            if(!auth.user) {
                throw Error("Not logged in");
            }

            if(isModeration) {
                if(props.poap) {
                    await moderateMut.mutateAsync({
                        main: actors.main,
                        pubId: props.poap.pubId, 
                        req: transformReq(),
                        mod: transformModerationForm(modForm)
                    });
                    props.onSuccess(intl.formatMessage({defaultMessage: 'Poap moderated!'}));
                }
            }
            else {
                if(!props.poap) {
                    if(!actors.main) {
                        throw Error("Main canister undefined");
                    }
                    
                    if(poapDeployingPrice + fees >= balance) {
                        throw Error(`Insufficient funds! Needed: ${icpToDecimal(poapDeployingPrice + fees)} ICP.`)
                    }

                    await depositIcp(auth.user, poapDeployingPrice + fees, actors.main, actors.ledger);
                    
                    try {
                        await createMut.mutateAsync({
                            main: actors.main,
                            req: transformReq(),
                        });
                        props.onSuccess(intl.formatMessage({defaultMessage: 'Poap created!'}));
                    }
                    catch(e) {
                        throw e;
                    }
                }
                else {
                    await updateMut.mutateAsync({
                        main: actors.main,
                        pubId: props.poap.pubId, 
                        req: transformReq(),
                    });
                    props.onSuccess(intl.formatMessage({defaultMessage: 'Poap updated!'}));
                }
            }

            props.onClose();
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, modForm, props.poap, balance, poapDeployingPrice, updateState, props.onClose]);

    const handleClose = useCallback((e: any) => {
        e.preventDefault();
        props.onClose();
    }, [props.onClose]);

    useEffect(() => {
        setForm(loadForm(props.campaignId, props.poap));
    }, [props.poap]);

    useEffect(() => {
        updateState();
    }, [updateState]);


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
                {props.reportId && isModerator(auth.user) &&
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
