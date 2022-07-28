import React, {useState, useContext, useCallback, useEffect, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import {useCompleteFunding, useCreateFunding, useDeleteFunding} from "../../../../../hooks/fundings";
import {FundingRequest, Campaign} from "../../../../../../../declarations/metamob/metamob.did";
import {idlFactory as Ledger} from "../../../../../../../declarations/ledger";
import { AuthContext } from "../../../../../stores/auth";
import Button from "../../../../../components/Button";
import TextAreaField from "../../../../../components/TextAreaField";
import { ActorActionType, ActorContext } from "../../../../../stores/actor";
import CheckboxField from "../../../../../components/CheckboxField";
import TextField from "../../../../../components/TextField";
import { depositIcp, getIcpBalance } from "../../../../../libs/users";
import { createLedgerActor, LEDGER_TRANSFER_FEE } from "../../../../../libs/backend";
import { icpToDecimal } from "../../../../../libs/icp";
import { Identity } from "@dfinity/agent";
import SelectField from "../../../../../components/SelectField";
import NumberField from "../../../../../components/NumberField";
import CustomSelectField from "../../../../../components/CustomSelectField";
import Badge from "../../../../../components/Badge";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    tier: yup.number().required(),
    amount: yup.number().required().min(1),
    anonymous: yup.bool().required(),
});

const FundingForm = (props: Props) => {
    const [auth, ] = useContext(AuthContext);
    const [actors, actorDispatch] = useContext(ActorContext);

    const [balance, setBalance] = useState(BigInt(0));

    const [form, setForm] = useState<FundingRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: '',
        tier: 0,
        amount: 0,
        value: BigInt(0)
    });
    const [isLoading, setIsLoading] = useState(false);
    
    const createMut = useCreateFunding();
    const completeMut = useCompleteFunding();
    const deleteMut = useDeleteFunding();

    const navigate = useNavigate();

    const getLedgerCanister = async (
    ): Promise<Ledger | undefined> => {
        if(actors.ledger) {
            return actors.ledger;
        }
        
        if(!auth.identity) {
            return undefined;
        }

        const ledger = createLedgerActor(auth.identity);
        actorDispatch({
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
            [field]: value
        }));
    }, []);

    const validate = (form: FundingRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleFunding = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }

        try {
            setIsLoading(true);
            props.toggleLoading(true);

            if(!actors.main) {
                throw Error("Main canister undefined");
            }

            if(!auth.user) {
                throw Error("Not logged in");
            }

            const info = props.campaign.info;
            const tiers = 'funding' in info?
                info.funding.tiers:
                [];

            const value = tiers[Number(form.tier)].value * BigInt(form.amount);

            if(value + LEDGER_TRANSFER_FEE >= balance) {
                throw Error(`Insufficient funds! Needed: ${icpToDecimal(value + LEDGER_TRANSFER_FEE)} ICP.`)
            }

            const funding = await createMut.mutateAsync({
                main: actors.main,
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
                    tier: Number(form.tier),
                    amount: Number(form.amount),
                    value: value,
                    anonymous: form.anonymous,
                }
            });

            try {
                await depositIcp(auth.user, value, actors.main, actors.ledger);
            }
            catch(e) {
                await deleteMut.mutateAsync({
                    main: actors.main,
                    pubId: funding.pubId,
                    campaignPubId: props.campaign.pubId,
                });
                throw e;
            }

            await completeMut.mutateAsync({
                main: actors.main,
                pubId: funding.pubId,
                campaignPubId: props.campaign.pubId,
            });

            updateState();
            props.onSuccess('Your funding has been sent!');
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            setIsLoading(false);
            props.toggleLoading(false);
        }
    }, [form, balance, props.campaign, updateState]);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=/c/${props.campaign.pubId}`);
    }, [props.campaign.pubId]);

    useEffect(() => {
        updateState();
    }, [updateState]);

    const isLoggedIn = !!auth.user;

    const tiersAsOptions = useMemo(() => {
        return 'funding' in props.campaign.info?
            props.campaign.info.funding.tiers.map((tier, index) => {
                return {
                    name: `${tier.title} (${icpToDecimal(tier.value)} ICP)`, 
                    value: index,
                    node: 
                        <div className="tier-option">
                            <div className="has-text-info"><b>Tier {1+index}</b></div>
                            <div>
                                <strong>{tier.title} ({icpToDecimal(tier.value)} ICP)</strong>
                            </div> 
                            <div>
                                <small>{tier.desc}</small>
                            </div>
                            <div className="has-text-right">
                                <Badge color="info">{tier.total.toString()}/{tier.max.toString()}</Badge>
                            </div>
                        </div>, 
                };
            })
        :
            []
    }, [props.campaign.info]);

    return (
        <form onSubmit={handleFunding}>
            <div>
                {isLoggedIn && 
                    <>
                        <CustomSelectField
                            label="Tier"
                            name="tier"
                            value={form.tier}
                            options={tiersAsOptions}
                            onChange={changeForm}
                        />
                        <NumberField
                            label="Amount"
                            name="amount"
                            value={form.amount}
                            min={1}
                            required
                            onChange={changeForm}
                        />
                        <TextField
                            label="From account id"
                            value={auth.identity? 
                                auth.identity.getPrincipal().toString(): 
                                ''
                            }
                            disabled={true}
                        />
                        <TextField
                            label="Account balance"
                            value={icpToDecimal(balance)}
                            disabled={true}
                        />
                        <TextAreaField
                            label="Message"
                            name="body"
                            value={form.body || ''}
                            rows={3}
                            onChange={changeForm}
                        />
                        <CheckboxField
                            label="Fund as anonymous"
                            id="anonymous"
                            value={form.anonymous}
                            onChange={changeForm}
                        />
                    </>
                }

                <div className="has-text-danger is-size-7"><b>Warning: THIS IS A TEST SITE. ANY ICP SENT WILL BE LOST!</b></div>

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={isLoggedIn? handleFunding: redirectToLogon}
                            disabled={isLoading}
                        >
                            <i className="la la-lightbulb"/>&nbsp;FUND
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default FundingForm;