import React, {useState, useContext, useCallback, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import {useCompleteDonation, useCreateDonation, useDeleteDonation} from "../../../../hooks/donations";
import {DonationRequest, Campaign} from "../../../../../../declarations/dchanges/dchanges.did";
import {idlFactory as Ledger} from "../../../../../../declarations/ledger";
import { AuthContext } from "../../../../stores/auth";
import Button from "../../../../components/Button";
import TextAreaField from "../../../../components/TextAreaField";
import { ActorActionType, ActorContext } from "../../../../stores/actor";
import CheckboxField from "../../../../components/CheckboxField";
import TextField from "../../../../components/TextField";
import { depositIcp, getBalance } from "../../../../libs/users";
import { createLedgerActor, LEDGER_TRANSFER_FEE } from "../../../../libs/backend";
import { decimalToIcp, icpToDecimal } from "../../../../libs/utils";

interface Props {
    campaign: Campaign;
    onSuccess: (message: string) => void;
    onError: (message: any) => void;
    toggleLoading: (to: boolean) => void;
};

const formSchema = yup.object().shape({
    body: yup.string(),
    value: yup.number().required().min(0.00010000 * 10),
    anonymous: yup.bool().required(),
});

const DonationForm = (props: Props) => {
    const [authState, ] = useContext(AuthContext);
    const [actorState, actorDispatch] = useContext(ActorContext);

    const [balance, setBalance] = useState(BigInt(0));

    const [form, setForm] = useState<DonationRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: '',
        value: BigInt(0)
    });
    
    const createMut = useCreateDonation();
    const completeMut = useCompleteDonation();
    const deleteMut = useDeleteDonation();

    const navigate = useNavigate();

    const getLedgerCanister = async (
    ): Promise<Ledger | undefined> => {
        if(actorState.ledger) {
            return actorState.ledger;
        }
        
        if(!authState.identity) {
            return undefined;
        }

        const ledger = createLedgerActor(authState.identity);
        actorDispatch({
            type: ActorActionType.SET_LEDGER,
            payload: ledger
        });

        return ledger;
    };

    const init = useCallback(async(
    ) => {
        const ledger = await getLedgerCanister();
        if(!ledger) {
            return;
        }

        const identity = authState.identity;
        if(!identity) {
            return;
        }

        const balance = await getBalance(identity, ledger);
        setBalance(balance);
    }, []);

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

    const validate = async (form: DonationRequest): Promise<string[]> => {
        try {
            await formSchema.validate(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleDonation = useCallback(async (e: any) => {
        e.preventDefault();

        const errors = await validate(form);
        if(errors.length > 0) {
            props.onError(errors);
            return;
        }

        try {
            props.toggleLoading(true);

            if(!actorState.main) {
                throw Error("Main caninster undefined");
            }

            if(!authState.user) {
                throw Error("Not logged in");
            }
            
            const value = decimalToIcp(form.value.toString());

            if(value + LEDGER_TRANSFER_FEE >= balance) {
                throw Error(`Insufficient funds: ${icpToDecimal(balance)} ICP. Needed: ${icpToDecimal(value + LEDGER_TRANSFER_FEE)} ICP.`)
            }

            const donation = await createMut.mutateAsync({
                main: actorState.main,
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
                    value: value,
                    anonymous: form.anonymous,
                }
            });

            try {
                await depositIcp(authState.user, value, actorState.main, actorState.ledger);
            }
            catch(e) {
                await deleteMut.mutateAsync({
                    main: actorState.main,
                    pubId: donation.pubId,
                    campaignPubId: props.campaign.pubId,
                });
                throw e;
            }

            await completeMut.mutateAsync({
                main: actorState.main,
                pubId: donation.pubId,
                campaignPubId: props.campaign.pubId,
            });

            props.onSuccess('Your donation has been sent!');
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            props.toggleLoading(false);
        }
    }, [form, balance]);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=/c/${props.campaign.pubId}`);
    }, [props.campaign.pubId]);

    useEffect(() => {
        init();
    }, []);

    const isLoggedIn = !!authState.user;

    return (
        <form onSubmit={handleDonation}>
            <div>
                {isLoggedIn && 
                    <>
                        <TextField
                            label="Value (ICP)"
                            id="value"
                            value={form.value.toString()}
                            onChange={changeForm}
                        />
                        <TextField
                            label="From account id"
                            value={authState.identity? 
                                authState.identity.getPrincipal().toString(): 
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
                            rows={4}
                            onChange={changeForm}
                        />
                        <CheckboxField
                            label="Donate as anonymous"
                            id="anonymous"
                            value={form.anonymous}
                            onChange={changeForm}
                        />
                    </>
                }

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={isLoggedIn? handleDonation: redirectToLogon}
                            disabled={isLoggedIn? createMut.isLoading: false}
                        >
                            <i className="la la-money-bill"/>&nbsp;DONATE
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default DonationForm;