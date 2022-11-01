import React, {useState, useContext, useCallback, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup';
import {useCompleteDonation, useCreateDonation, useDeleteDonation} from "../../../../../hooks/donations";
import {DonationRequest, Campaign} from "../../../../../../../declarations/metamob/metamob.did";
import {idlFactory as Ledger} from "../../../../../../../declarations/ledger";
import { AuthContext } from "../../../../../stores/auth";
import Button from "../../../../../components/Button";
import TextAreaField from "../../../../../components/TextAreaField";
import { ActorActionType, ActorContext } from "../../../../../stores/actor";
import CheckboxField from "../../../../../components/CheckboxField";
import TextField from "../../../../../components/TextField";
import { depositIcp, getIcpBalance } from "../../../../../libs/users";
import { createLedgerActor, LEDGER_TRANSFER_FEE } from "../../../../../libs/backend";
import { decimalToIcp, icpToDecimal } from "../../../../../libs/icp";
import { Identity } from "@dfinity/agent";
import { FormattedMessage } from "react-intl";

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
    const [auth, ] = useContext(AuthContext);
    const [actors, actorDispatch] = useContext(ActorContext);

    const [balance, setBalance] = useState(BigInt(0));

    const [form, setForm] = useState<DonationRequest>({
        campaignId: props.campaign._id,
        anonymous: false,
        body: '',
        value: BigInt(0)
    });
    const [isLoading, setIsLoading] = useState(false);
    
    const createMut = useCreateDonation();
    const completeMut = useCompleteDonation();
    const deleteMut = useDeleteDonation();

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

    const validate = (form: DonationRequest): string[] => {
        try {
            formSchema.validateSync(form, {abortEarly: false});
            return [];
        }
        catch(e: any) {
            return e.errors;
        }
    };

    const handleDonation = useCallback(async (e: any) => {
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
            
            const value = decimalToIcp(form.value.toString());

            if(value + LEDGER_TRANSFER_FEE >= balance) {
                throw Error(`Insufficient funds! Needed: ${icpToDecimal(value + LEDGER_TRANSFER_FEE)} ICP.`)
            }

            const donation = await createMut.mutateAsync({
                main: actors.main,
                req: {
                    campaignId: props.campaign._id,
                    body: form.body,
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
                    pubId: donation.pubId,
                    campaignPubId: props.campaign.pubId,
                });
                throw e;
            }

            await completeMut.mutateAsync({
                main: actors.main,
                pubId: donation.pubId,
                campaignPubId: props.campaign.pubId,
            });

            updateState();
            props.onSuccess('Your donation has been sent!');
        }
        catch(e) {
            props.onError(e);
        }
        finally {
            setIsLoading(false);
            props.toggleLoading(false);
        }
    }, [form, balance, updateState]);

    const redirectToLogon = useCallback(() => {
        navigate(`/user/login?return=/c/${props.campaign.pubId}`);
    }, [props.campaign.pubId]);

    useEffect(() => {
        updateState();
    }, [updateState]);

    const isLoggedIn = !!auth.user;

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
                            label="Donate as anonymous"
                            id="anonymous"
                            value={form.anonymous}
                            onChange={changeForm}
                        />
                    </>
                }
                
                <div className="has-text-danger is-size-7"><b><FormattedMessage defaultMessage="Warning: THIS IS A TEST SITE. ANY ICP SENT WILL BE LOST!"/></b></div>

                <div className="field mt-2">
                    <div className="control">
                        <Button
                            color="danger"
                            onClick={isLoggedIn? handleDonation: redirectToLogon}
                            disabled={isLoading}
                        >
                            <i className="la la-money-bill"/>&nbsp;<FormattedMessage id="DONATE" defaultMessage="DONATE"/>
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default DonationForm;